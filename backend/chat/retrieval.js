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
  if (EMBEDDING_PROVIDER === "ollama") {
    return embedWithOllama(text);
  }

  if (!process.env.OPENAI_API_KEY || !openai) {
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

  const normalizedVector = normalizeVectorDimension(vector, EMBEDDING_DIM);
  return `[${normalizedVector.join(",")}]`;
}

async function embedWithOllama(text) {
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
  const vector = data?.embedding;
  if (!Array.isArray(vector) || !vector.length) {
    throw new Error("Ollama embedding returned empty vector");
  }

  const normalizedVector = normalizeVectorDimension(vector, EMBEDDING_DIM);
  return `[${normalizedVector.join(",")}]`;
}

function normalizeVectorDimension(vector, targetDim) {
  if (!Number.isFinite(targetDim) || targetDim <= 0) {
    throw new Error("EMBEDDING_DIM must be a positive integer");
  }

  if (vector.length === targetDim) return vector;
  if (vector.length > targetDim) return vector.slice(0, targetDim);

  const padded = new Array(targetDim).fill(0);
  for (let i = 0; i < vector.length; i += 1) padded[i] = vector[i];
  return padded;
}

function getDomainAliases(domain) {
  if (!domain) return [];

  const normalized = String(domain).trim().toLowerCase();
  const aliasMap = {
    health: ["health", "health insurance"],
    "health insurance": ["health", "health insurance"],
    motor: ["motor", "motor insurance", "car insurance", "bike insurance"],
    "motor insurance": ["motor", "motor insurance", "car insurance", "bike insurance"],
    crop: ["crop", "crop insurance", "agriculture", "agri", "agriculture insurance"],
    "crop insurance": ["crop", "crop insurance", "agriculture", "agri", "agriculture insurance"],
    travel: ["travel", "travel insurance"],
    "travel insurance": ["travel", "travel insurance"],
    any: [],
  };

  return [...new Set(aliasMap[normalized] || [normalized])];
}

export async function retrieveChunks({
  question,
  domain = null,
  policyName = null,
  limit = 6,
}) {
  const domainAliases = getDomainAliases(domain);
  const useOllamaEmbeddings = EMBEDDING_PROVIDER === "ollama";
  const useOpenAIEmbeddings = EMBEDDING_PROVIDER === "openai" && hasOpenAIKey;

  if (!useOllamaEmbeddings && !useOpenAIEmbeddings) {
    return retrieveChunksByKeyword({
      question,
      domain: domainAliases,
      policyName,
      limit,
    });
  }

  let vector;
  try {
    vector = await embed(question);
  } catch (err) {
    console.warn(
      `Embedding lookup failed for provider "${EMBEDDING_PROVIDER}", falling back to keyword search: ${err.message}`
    );
    return retrieveChunksByKeyword({
      question,
      domain: domainAliases,
      policyName,
      limit,
    });
  }

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

  if (domainAliases.length) {
    sql += ` WHERE LOWER(domain) = ANY($2) `;
    params.push(domainAliases);
  }

  if (policyName) {
    sql += domainAliases.length ? ` AND policy_name = $3 ` : ` WHERE policy_name = $2 `;
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
  const domainAliases = Array.isArray(domain) ? domain : getDomainAliases(domain);
  const terms = tokenize(question).slice(0, 6);
  if (!terms.length) return [];

  const clauses = [];
  const scoreClauses = [];
  const params = [];
  let idx = 1;

  for (const term of terms) {
    const placeholder = `$${idx}`;
    clauses.push(
      `(content ILIKE ${placeholder} OR policy_name ILIKE ${placeholder} OR section ILIKE ${placeholder})`
    );
    scoreClauses.push(`
      CASE
        WHEN policy_name ILIKE ${placeholder} THEN 3
        WHEN section = 'best_for' AND content ILIKE ${placeholder} THEN 2.5
        WHEN section = 'raw_text' AND content ILIKE ${placeholder} THEN 2.2
        WHEN content ILIKE ${placeholder} THEN 1
        WHEN section ILIKE ${placeholder} THEN 0.6
        ELSE 0
      END
    `);
    params.push(`%${term}%`);
    idx += 1;
  }

  let sql = `
    SELECT
      domain,
      policy_name,
      section,
      content,
      (
        ${scoreClauses.join(" + ")} +
        CASE
          WHEN section = 'best_for' THEN 1.2
          WHEN section = 'raw_text' THEN 1
          WHEN section LIKE 'coverage.%' THEN 0.8
          WHEN section LIKE 'claim_process.%' THEN 0.4
          ELSE 0
        END
      ) AS similarity
    FROM policy_chunks
  `;

  const whereParts = [];
  if (domainAliases.length) {
    whereParts.push(`LOWER(domain) = ANY($${idx})`);
    params.push(domainAliases);
    idx += 1;
  }
  if (policyName) {
    whereParts.push(`policy_name = $${idx}`);
    params.push(policyName);
    idx += 1;
  }
  whereParts.push(`(${clauses.join(" OR ")})`);
  sql += ` WHERE ${whereParts.join(" AND ")} `;

  sql += `
    ORDER BY similarity DESC, policy_name ASC, section ASC
    LIMIT ${limit}
  `;

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
