import { db } from "./db.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const embedModel = genAI.getGenerativeModel({
  model: "text-embedding-004",
});

/**
 * Retrieve relevant policy chunks using vector similarity
 */
export async function retrieveChunks({
  question,
  domain = null,
  limit = 6,
}) {
  // 1️⃣ Embed the user question
  const emb = await embedModel.embedContent(question);
  const queryVector = `[${emb.embedding.values.join(",")}]`;

  // 2️⃣ Build SQL dynamically (domain optional)
  let sql = `
    SELECT
      domain,
      policy_name,
      section,
      content,
      1 - (embedding <-> $1::vector) AS similarity
    FROM policy_chunks
  `;

  const params = [queryVector];

  if (domain) {
    sql += ` WHERE domain = $2 `;
    params.push(domain);
  }

  sql += `
    ORDER BY embedding <-> $1::vector
    LIMIT ${limit}
  `;

  // 3️⃣ Query database
  const result = await db.query(sql, params);

  return result.rows;
}
