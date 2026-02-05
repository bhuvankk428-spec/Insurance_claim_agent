import OpenAI from "openai";
import { db } from "./db.js";

const hasOpenAIKey =
  Boolean(process.env.OPENAI_API_KEY) &&
  !process.env.OPENAI_API_KEY.startsWith("your_");
const openai = hasOpenAIKey
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: Number(process.env.OPENAI_TIMEOUT_MS || 60000),
    })
  : null;

const EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small";

async function embed(text) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const res = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: text.slice(0, 4000),
  });

  const vector = res.data?.[0]?.embedding;
  if (!vector?.length) {
    throw new Error("Embedding failed");
  }

  return `[${vector.join(",")}]`;
}

export async function retrieveChunks({
  question,
  domain = null,
  limit = 6,
}) {
  if (!hasOpenAIKey) {
    return retrieveChunksByKeyword({ question, domain, limit });
  }

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

async function retrieveChunksByKeyword({ question, domain = null, limit = 6 }) {
  const terms = tokenize(question).slice(0, 6);
  if (!terms.length) return [];

  const clauses = [];
  const params = [];
  let idx = 1;

  for (const term of terms) {
    clauses.push(
      `(content ILIKE $${idx} OR policy_name ILIKE $${idx} OR section ILIKE $${idx})`
    );
    params.push(`%${term}%`);
    idx += 1;
  }

  let sql = `
    SELECT
      domain,
      policy_name,
      section,
      content,
      0.1 AS similarity
    FROM policy_chunks
  `;

  if (domain) {
    sql += ` WHERE domain = $${idx} AND (${clauses.join(" OR ")}) `;
    params.push(domain);
  } else {
    sql += ` WHERE ${clauses.join(" OR ")} `;
  }

  sql += ` LIMIT ${limit} `;

  const { rows } = await db.query(sql, params);
  return rows;
}

function tokenize(text = "") {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length > 2);
}
