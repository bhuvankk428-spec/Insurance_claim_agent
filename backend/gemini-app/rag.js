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
        `(${i + 1}) ${c.policy_name} – ${c.section}\n${c.content}`
    )
    .join("\n\n");

  /* 4️⃣ Tight prompt */
  const prompt = `
You are an experienced insurance advisor in India.

User question:
${question}

Policy excerpts:
${context}

Rules:
- Compare only listed policies
- Choose ONE best policy
- No assumptions
- Say "data not available" if missing
- Markdown only

Answer format:

✅ **Recommended policy**
<policy>

### Comparison
<short>

### Why this is best
<reason>

### Claim process
<steps>
`;

  /* 5️⃣ Stream from Ollama */
  const controller = new AbortController();

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: controller.signal,
    body: JSON.stringify({
      model: "llama3",
      prompt,
      stream: true,
      options: {
        temperature: 0.2,
        num_ctx: 4096,
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
    controller.abort(); // ✅ ensure Ollama stops
  }
}
