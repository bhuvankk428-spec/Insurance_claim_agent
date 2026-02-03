import fs from "fs";
import fetch from "node-fetch";
import { db } from "../db.js";

const OLLAMA_URL = "http://localhost:11434/api/embeddings";
const MODEL = "nomic-embed-text";

const chunks = JSON.parse(
  fs.readFileSync("policy_chunks.json", "utf-8")
);

console.log(`🔢 Embedding ${chunks.length} chunks...`);

for (const chunk of chunks) {
  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      prompt: chunk.text.slice(0, 4000),
    }),
  });

  if (!res.ok) throw new Error("Ollama embedding failed");

  const data = await res.json();
  const vector = `[${data.embedding.join(",")}]`;

  await db.query(
    `
    INSERT INTO policy_chunks
      (domain, policy_name, section, content, embedding)
    VALUES
      ($1, $2, $3, $4, $5::vector)
    `,
    [
      chunk.domain,
      chunk.policy_name,
      chunk.section,
      chunk.text,
      vector,
    ]
  );
}

console.log("✅ All chunks embedded & stored");
process.exit();
