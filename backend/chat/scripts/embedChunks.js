import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import OpenAI from "openai";
import { db } from "../db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env"), quiet: true });
dotenv.config({ quiet: true });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: Number(process.env.OPENAI_TIMEOUT_MS || 60000),
});

const EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small";

const chunks = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../policy_chunks.json"), "utf-8")
);

console.log(`Embedding ${chunks.length} chunks...`);

for (const chunk of chunks) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const res = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: chunk.text.slice(0, 4000),
  });

  const vector = res.data?.[0]?.embedding;
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
