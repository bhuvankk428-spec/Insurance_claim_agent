import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import OpenAI from "openai";
import { db } from "../db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env"), quiet: true });
dotenv.config({ quiet: true });

const EMBEDDING_PROVIDER = String(
  process.env.EMBEDDING_PROVIDER || "openai"
).toLowerCase();
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const OLLAMA_EMBED_MODEL =
  process.env.OLLAMA_EMBED_MODEL || process.env.OPENAI_EMBED_MODEL || "nomic-embed-text";
const EMBEDDING_DIM = Number.parseInt(
  process.env.EMBEDDING_DIM || (EMBEDDING_PROVIDER === "ollama" ? "768" : "1536"),
  10
);
const EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small";
const openai =
  EMBEDDING_PROVIDER === "openai"
    ? new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: Number(process.env.OPENAI_TIMEOUT_MS || 60000),
      })
    : null;

const chunks = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../policy_chunks.json"), "utf-8")
);

console.log(`Embedding ${chunks.length} chunks...`);

for (const chunk of chunks) {
  const vector = normalizeVectorDimension(await createEmbedding(chunk.text), EMBEDDING_DIM);
  if (!vector?.length) {
    throw new Error("Embedding failed");
  }

  const vectorString = `[${vector.join(",")}]`;

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
      vectorString,
    ]
  );
}

console.log("All chunks embedded and stored");
process.exit();

async function createEmbedding(text) {
  if (EMBEDDING_PROVIDER === "ollama") {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_EMBED_MODEL,
        prompt: text.slice(0, 4000),
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Ollama embedding failed: ${response.status} ${body}`);
    }

    const data = await response.json();
    return data?.embedding;
  }

  if (!process.env.OPENAI_API_KEY || !openai) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const res = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: text.slice(0, 4000),
  });

  return res.data?.[0]?.embedding;
}

function normalizeVectorDimension(vector, targetDim) {
  if (!Array.isArray(vector) || !vector.length) {
    throw new Error("Embedding provider returned empty vector");
  }

  if (!Number.isFinite(targetDim) || targetDim <= 0) {
    throw new Error("EMBEDDING_DIM must be a positive integer");
  }

  if (vector.length === targetDim) return vector;
  if (vector.length > targetDim) return vector.slice(0, targetDim);

  const padded = new Array(targetDim).fill(0);
  for (let i = 0; i < vector.length; i += 1) padded[i] = vector[i];
  return padded;
}
