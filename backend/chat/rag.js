import { retrieveChunks } from "./retrieval.js";
import { scorePolicy } from "./rules.js";

export async function askRAGStream({
  question,
  domain = null,
  details = {},
  onToken,
}) {
  /* 1️⃣ Retrieve chunks */
  const rawChunks = await retrieveChunks({
    question,
    domain,
    limit: 6,
  });

  if (!rawChunks?.length) {
    onToken("❌ **No suitable policy found**\n\nPlease provide more details.");
    return;
  }

  /* 2️⃣ Rank (hybrid: rules + vector) */
  const chunks = rawChunks
    .map(c => ({
      ...c,
      score: scorePolicy(c, details) * 0.7 + c.similarity * 0.3,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  /* 3️⃣ Compact context */
  const context = chunks
    .map(
      (c, i) =>
        `(${i + 1}) ${c.policy_name} - ${c.section}\n${(c.content || "")
          .slice(0, 800)
          .trim()}`
    )
    .join("\n\n");

  /* 4️⃣ Tight prompt */
  const prompt = `
You are an insurance advisor. Use ONLY the policy excerpts below.
If data is missing, say "data not available".

Question:
${question}

Policy excerpts:
${context}

Answer in Markdown with:
✅ **Recommended policy**
### Comparison (2-4 bullets)
### Why this is best (2-4 bullets)
### Claim process (3-6 steps)
`;

  /* 5️⃣ Stream from Ollama */
  const controller = new AbortController();
  const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 60000);
  const timeout =
    timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;

  const ollamaBase = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const ollamaModel = process.env.OLLAMA_CHAT_MODEL || "llama3";

  const response = await fetch(`${ollamaBase}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: controller.signal,
    body: JSON.stringify({
      model: ollamaModel,
      prompt,
      stream: true,
      options: {
        temperature: 0.2,
        top_p: 0.9,
        top_k: 40,
        repeat_penalty: 1.1,
        num_ctx: Number(process.env.OLLAMA_NUM_CTX || 2048),
        num_predict: Number(process.env.OLLAMA_MAX_TOKENS || 350),
      },
    }),
  });

  if (!response.body) {
    throw new Error("Ollama streaming not supported");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop(); // keep incomplete chunk

      for (const line of lines) {
        if (!line.trim()) continue;

        let json;
        try {
          json = JSON.parse(line);
        } catch {
          continue; // ⚠️ skip malformed chunks safely
        }

        if (json.response) {
          onToken(json.response);
        }

        if (json.done) {
          return;
        }
      }
    }
  } finally {
    if (timeout) clearTimeout(timeout);
    controller.abort(); // ✅ ensure Ollama stops
  }
}

