import fs from "fs";
import { db } from "../db.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const embedModel = genAI.getGenerativeModel({
  model: "text-embedding-004",
});

// read chunks
const chunks = JSON.parse(
  fs.readFileSync("policy_chunks.json", "utf-8")
);

for (const chunk of chunks) {
  const emb = await embedModel.embedContent(chunk.text);

  // ✅ convert array → pgvector string
  const vector = `[${emb.embedding.values.join(",")}]`;

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
