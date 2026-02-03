
import { db } from "./db.js";

const OLLAMA_URL = "http://localhost:11434/api/embeddings";
const MODEL = "nomic-embed-text";

async function embed(text) {
  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      prompt: text.slice(0, 4000),
    }),
  });

  if (!res.ok) {
    throw new Error("Embedding failed");
  }

  const data = await res.json();

  // ✅ EXACT SAME FORMAT AS embedChunks.js
  return `[${data.embedding.join(",")}]`;
}

export async function retrieveChunks({
  question,
  domain = null,
  limit = 6,
}) {
  const vector = await embed(question);

  let sql = `
    SELECT
      domain,
      policy_name,
      section,
      content,
      1 - (embedding <-> $1::vector) AS similarity
    FROM policy_chunks
  `;

  const params = [vector];

  if (domain) {
    sql += ` WHERE domain = $2 `;
    params.push(domain);
  }

  sql += `
    ORDER BY embedding <-> $1::vector
    LIMIT ${limit}
  `;

  const { rows } = await db.query(sql, params);
  return rows;
}
