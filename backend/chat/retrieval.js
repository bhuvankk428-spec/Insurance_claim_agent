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
const MAX_RETRIES = Number(process.env.OPENAI_MAX_RETRIES || 2);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(err) {
  const status = err?.status;
  if (!status) return false;
  return [408, 429, 500, 502, 503, 504].includes(status);
}

async function withRetry(fn, retries = MAX_RETRIES) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      if (attempt > retries || !isRetryable(err)) {
        throw err;
      }
      const backoff = 300 * Math.pow(2, attempt);
      await sleep(backoff);
    }
  }
}

async function embed(text) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const res = await withRetry(() =>
    openai.embeddings.create({
      model: EMBED_MODEL,
      input: text.slice(0, 4000),
    })
  );

  const vector = res.data?.[0]?.embedding;
  if (!vector?.length) {
    throw new Error("Embedding failed");
  }

  return `[${vector.join(",")}]`;
}

export async function retrieveChunks({
  question,
  domain = null,
  policyName = null,
  limit = 6,
}) {
  if (!hasOpenAIKey) {
    return retrieveChunksByKeyword({ question, domain, policyName, limit });
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

  if (policyName) {
    sql += domain ? ` AND policy_name = $3 ` : ` WHERE policy_name = $2 `;
    params.push(policyName);
  }

  sql += `
    ORDER BY embedding <-> $1::vector
    LIMIT ${limit}
  `;

  const { rows } = await db.query(sql, params);
  return rows;
}

async function retrieveChunksByKeyword({
  question,
  domain = null,
  policyName = null,
  limit = 6,
}) {
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

  const whereParts = [];
  if (domain) {
    whereParts.push(`domain = $${idx}`);
    params.push(domain);
    idx += 1;
  }
  if (policyName) {
    whereParts.push(`policy_name = $${idx}`);
    params.push(policyName);
    idx += 1;
  }
  whereParts.push(`(${clauses.join(" OR ")})`);
  sql += ` WHERE ${whereParts.join(" AND ")} `;

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
