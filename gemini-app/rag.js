import { retrieveChunks } from "./retrieval.js";
import "dotenv/config";

export async function askRAG({ question, domain = null }) {
  // 1️⃣ Retrieve relevant chunks
  const chunks = await retrieveChunks({
    question,
    domain,
    limit: 6,
  });

  // 2️⃣ Build context
  const context = chunks
    .map(
      (c, i) =>
        `(${i + 1}) [${c.policy_name} | ${c.section}]\n${c.content}`
    )
    .join("\n\n");

  // 3️⃣ Prompt
  const prompt = `
You are an insurance assistant.
Answer ONLY using the information below.
If the answer is not present, say "I don't have enough information."

Information:
${context}

Question:
${question}

Answer:
`;

  // 4️⃣ Call OLLAMA (LOCAL, FREE)
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3",
      prompt,
      stream: false,
    }),
  });

  const data = await response.json();

  const answer = data.response;

  // 5️⃣ Confidence score
  const avgSim =
    chunks.reduce((s, c) => s + c.similarity, 0) / chunks.length;

  const confidence = Math.round(Math.min(90, Math.max(35, avgSim * 100)));

  return { answer, confidence };
}
