import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import OpenAI from "openai";
import { hasRealOpenAIKey, resolveFromRoot } from "./env.js";
import { estimateCostUsd, roundUsd } from "./pricing.js";

const CHUNKS_PATH = resolveFromRoot("backend", "chat", "policy_chunks.json");
const CACHE_DIR = resolveFromRoot("eval", ".cache");

const DOMAIN_ALIASES = {
  health: ["health", "health insurance"],
  "health insurance": ["health", "health insurance"],
  motor: ["motor", "motor insurance", "car insurance", "bike insurance"],
  "motor insurance": [
    "motor",
    "motor insurance",
    "car insurance",
    "bike insurance",
  ],
  crop: [
    "crop",
    "crop insurance",
    "agriculture",
    "agri",
    "agriculture insurance",
  ],
  "crop insurance": [
    "crop",
    "crop insurance",
    "agriculture",
    "agri",
    "agriculture insurance",
  ],
  travel: ["travel", "travel insurance"],
  "travel insurance": ["travel", "travel insurance"],
  any: [],
};

function loadChunks() {
  return JSON.parse(fs.readFileSync(CHUNKS_PATH, "utf8"));
}

function getDomainAliases(domain) {
  if (!domain) return [];
  const normalized = String(domain).trim().toLowerCase();
  return DOMAIN_ALIASES[normalized] || [normalized];
}

function tokenize(text = "") {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((term) => term.trim())
    .filter((term) => term.length > 2);
}

function filterChunksByDomain(chunks, domain) {
  const aliases = getDomainAliases(domain);
  if (!aliases.length) return chunks;

  return chunks.filter((chunk) =>
    aliases.includes(String(chunk.domain || "").toLowerCase())
  );
}

function keywordScore(chunk, question) {
  const terms = tokenize(question).slice(0, 6);
  if (!terms.length) return null;

  const policyName = String(chunk.policy_name || "").toLowerCase();
  const section = String(chunk.section || "").toLowerCase();
  const text = String(chunk.text || chunk.content || "").toLowerCase();
  let score = 0;
  let matchedAny = false;

  for (const term of terms) {
    if (policyName.includes(term)) {
      score += 3;
      matchedAny = true;
    } else if (section === "best_for" && text.includes(term)) {
      score += 2.5;
      matchedAny = true;
    } else if (section === "raw_text" && text.includes(term)) {
      score += 2.2;
      matchedAny = true;
    } else if (text.includes(term)) {
      score += 1;
      matchedAny = true;
    } else if (section.includes(term)) {
      score += 0.6;
      matchedAny = true;
    }
  }

  if (!matchedAny) return null;

  if (section === "best_for") score += 1.2;
  else if (section === "raw_text") score += 1;
  else if (section.startsWith("coverage.")) score += 0.8;
  else if (section.startsWith("claim_process.")) score += 0.4;

  return score;
}

function retrieveKeyword(chunks, question, domain, limit = 3) {
  const aliases = getDomainAliases(domain);
  const scored = [];

  for (const chunk of chunks) {
    if (
      aliases.length &&
      !aliases.includes(String(chunk.domain || "").toLowerCase())
    ) {
      continue;
    }

    const score = keywordScore(chunk, question);
    if (score === null) continue;
    scored.push({ ...chunk, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.policy_name !== b.policy_name) {
      return a.policy_name.localeCompare(b.policy_name);
    }
    return a.section.localeCompare(b.section);
  });

  return scored.slice(0, limit);
}

function hashText(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: Number(process.env.OPENAI_TIMEOUT_MS || 60000),
  });
}

function loadEmbeddingCache(model) {
  const cachePath = path.join(
    CACHE_DIR,
    `embeddings-${model.replace(/[^a-z0-9._-]/gi, "_")}.json`
  );

  if (!fs.existsSync(cachePath)) {
    return { cachePath, vectors: {} };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    return {
      cachePath,
      vectors: parsed.vectors || {},
    };
  } catch {
    return { cachePath, vectors: {} };
  }
}

function saveEmbeddingCache(cachePath, vectors) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify({ vectors }), "utf8");
}

async function embedBatch(client, model, inputs) {
  const response = await client.embeddings.create({
    model,
    input: inputs.map((input) => input.slice(0, 4000)),
  });

  return {
    vectors: response.data.map((item) => item.embedding),
    promptTokens: Number(response.usage?.prompt_tokens || 0),
  };
}

async function ensureChunkEmbeddings(client, model, chunks) {
  const { cachePath, vectors } = loadEmbeddingCache(model);
  const missing = [];
  const seen = new Set();

  for (const chunk of chunks) {
    const text = chunk.text || chunk.content || "";
    const key = hashText(`${model}\n${text}`);
    if (!vectors[key] && !seen.has(key)) {
      seen.add(key);
      missing.push({ key, text });
    }
  }

  let promptTokens = 0;

  for (let index = 0; index < missing.length; index += 64) {
    const batch = missing.slice(index, index + 64);
    const embedded = await embedBatch(
      client,
      model,
      batch.map((item) => item.text)
    );
    promptTokens += embedded.promptTokens;

    embedded.vectors.forEach((vector, vectorIndex) => {
      vectors[batch[vectorIndex].key] = vector;
    });
  }

  if (missing.length) {
    saveEmbeddingCache(cachePath, vectors);
  }

  return {
    vectors,
    promptTokens,
    embeddedChunks: missing.length,
  };
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const length = Math.min(a.length, b.length);

  for (let index = 0; index < length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }

  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function findExpectedRank(topChunks, expectedChunks) {
  for (let index = 0; index < topChunks.length; index += 1) {
    const chunk = topChunks[index];
    const matched = expectedChunks.some(
      (expected) =>
        expected.policy_name === chunk.policy_name &&
        expected.section === chunk.section
    );
    if (matched) return index + 1;
  }
  return null;
}

function compactChunks(chunks) {
  return chunks.map((chunk) => ({
    policy_name: chunk.policy_name,
    section: chunk.section,
    score: chunk.score ?? null,
    similarity: chunk.similarity ?? null,
  }));
}

function summarizeRagResults(results, extra = {}) {
  const evaluated = results.filter((result) => !result.skipped && !result.error);
  const top1 = evaluated.filter((result) => result.rank === 1).length;
  const top3 = evaluated.filter(
    (result) => result.rank !== null && result.rank <= 3
  ).length;
  const reciprocal = evaluated.reduce((total, result) => {
    return total + (result.rank ? 1 / result.rank : 0);
  }, 0);
  const latencySum = evaluated.reduce(
    (total, result) => total + result.latencyMs,
    0
  );
  const knownCost = evaluated.reduce(
    (total, result) => total + (result.costUsd || 0),
    0
  );
  const knownCostCases = evaluated.filter(
    (result) => result.costUsd !== null && result.costUsd !== undefined
  ).length;

  return {
    cases: results.length,
    evaluated: evaluated.length,
    skipped: results.length - evaluated.length,
    top1,
    top3,
    top1HitRate: evaluated.length ? top1 / evaluated.length : null,
    top3HitRate: evaluated.length ? top3 / evaluated.length : null,
    mrr: evaluated.length ? reciprocal / evaluated.length : null,
    avgLatencyMs: evaluated.length ? latencySum / evaluated.length : null,
    totalCostUsd: roundUsd(knownCost),
    avgCostPerQueryUsd: evaluated.length
      ? roundUsd(knownCost / evaluated.length)
      : null,
    costCoverage: evaluated.length ? knownCostCases / evaluated.length : null,
    ...extra,
  };
}

async function probeDatabase() {
  if (!process.env.DATABASE_URL) {
    return { ok: false, error: "DATABASE_URL is missing" };
  }

  const pg = (await import("pg")).default;
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 4000,
    max: 1,
  });

  try {
    await pool.query("SELECT COUNT(*)::int AS total FROM policy_chunks");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  } finally {
    await pool.end().catch(() => {});
  }
}

export async function chooseRagMode(requested = "auto") {
  if (requested !== "auto") {
    return { mode: requested, warnings: [] };
  }

  const probe = await probeDatabase();
  if (probe.ok) {
    return { mode: "db", warnings: [] };
  }

  const warnings = [
    `Postgres/pgvector unavailable (${probe.error}). Falling back to offline retrieval.`,
  ];

  if (hasRealOpenAIKey()) {
    return { mode: "embed", warnings };
  }

  warnings.push(
    "OPENAI_API_KEY is unavailable; using the keyword score used by the production fallback path."
  );
  return { mode: "keyword", warnings };
}

async function runKeywordSuite(cases, chunks, verbose) {
  const results = [];

  for (const testCase of cases) {
    const startedAt = performance.now();
    const topChunks = retrieveKeyword(
      chunks,
      testCase.input.question,
      testCase.input.domain,
      3
    );
    const latencyMs = performance.now() - startedAt;
    const rank = findExpectedRank(topChunks, testCase.expected.chunks);
    const matched = rank !== null && rank <= 3;

    results.push({
      id: testCase.id,
      type: testCase.type,
      expected: testCase.expected,
      rank,
      matched,
      latencyMs: Number(latencyMs.toFixed(2)),
      costUsd: 0,
      top3: compactChunks(topChunks),
      error: null,
    });

    if (verbose) {
      const marker = matched ? "PASS" : "FAIL";
      console.log(
        `[rag:keyword] ${marker} ${testCase.id} rank=${rank ?? "miss"} latency=${results.at(-1).latencyMs}ms`
      );
    }
  }

  return {
    mode: "keyword",
    cacheBuildCostUsd: 0,
    cacheEmbeddedChunks: 0,
    metrics: summarizeRagResults(results),
    cases: results,
  };
}

async function runEmbedSuite(cases, chunks, verbose) {
  const model = process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small";
  const client = getOpenAIClient();
  const cache = await ensureChunkEmbeddings(client, model, chunks);
  const cacheCost = estimateCostUsd(model, cache.promptTokens, 0) || 0;
  const results = [];

  for (const testCase of cases) {
    const queryStartedAt = performance.now();
    let queryVector = null;
    let promptTokens = 0;
    let error = null;

    try {
      const embedded = await embedBatch(client, model, [
        testCase.input.question,
      ]);
      queryVector = embedded.vectors[0];
      promptTokens = embedded.promptTokens;
    } catch (err) {
      error = err?.message || String(err);
    }

    if (error) {
      results.push({
        id: testCase.id,
        type: testCase.type,
        expected: testCase.expected,
        rank: null,
        matched: false,
        latencyMs: Number((performance.now() - queryStartedAt).toFixed(2)),
        costUsd: null,
        top3: [],
        error,
      });
      continue;
    }

    const scored = filterChunksByDomain(
      chunks,
      testCase.input.domain
    )
      .map((chunk) => {
        const text = chunk.text || chunk.content || "";
        const key = hashText(`${model}\n${text}`);
        const chunkVector = cache.vectors[key];
        return {
          ...chunk,
          similarity: chunkVector
            ? cosineSimilarity(queryVector, chunkVector)
            : 0,
        };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);

    const latencyMs = performance.now() - queryStartedAt;
    const rank = findExpectedRank(scored, testCase.expected.chunks);
    const matched = rank !== null && rank <= 3;
    const costUsd = estimateCostUsd(model, promptTokens, 0);

    results.push({
      id: testCase.id,
      type: testCase.type,
      expected: testCase.expected,
      rank,
      matched,
      latencyMs: Number(latencyMs.toFixed(2)),
      costUsd,
      promptTokens,
      top3: compactChunks(scored),
      error: null,
    });

    if (verbose) {
      const marker = matched ? "PASS" : "FAIL";
      console.log(
        `[rag:embed] ${marker} ${testCase.id} rank=${rank ?? "miss"} latency=${results.at(-1).latencyMs}ms`
      );
    }
  }

  return {
    mode: "embed",
    embeddingModel: model,
    cacheBuildCostUsd: roundUsd(cacheCost),
    cacheEmbeddedChunks: cache.embeddedChunks,
    metrics: summarizeRagResults(results, {
      embeddingModel: model,
      cacheBuildCostUsd: roundUsd(cacheCost),
      cacheEmbeddedChunks: cache.embeddedChunks,
    }),
    cases: results,
  };
}

async function runDbSuite(cases, verbose) {
  const { retrieveChunks } = await import(
    "../../backend/chat/retrieval.js"
  );
  const results = [];

  for (const testCase of cases) {
    const startedAt = performance.now();
    let rows = null;
    let error = null;

    try {
      rows = await retrieveChunks({
        question: testCase.input.question,
        domain:
          !testCase.input.domain || testCase.input.domain === "any"
            ? null
            : testCase.input.domain,
        limit: 3,
      });
    } catch (err) {
      error = err?.message || String(err);
    }

    const latencyMs = performance.now() - startedAt;

    if (error) {
      results.push({
        id: testCase.id,
        type: testCase.type,
        expected: testCase.expected,
        rank: null,
        matched: false,
        latencyMs: Number(latencyMs.toFixed(2)),
        costUsd: null,
        top3: [],
        error,
      });
      continue;
    }

    const topChunks = rows.map((row) => ({
      policy_name: row.policy_name,
      section: row.section,
      similarity: row.similarity,
    }));
    const rank = findExpectedRank(topChunks, testCase.expected.chunks);
    const matched = rank !== null && rank <= 3;

    results.push({
      id: testCase.id,
      type: testCase.type,
      expected: testCase.expected,
      rank,
      matched,
      latencyMs: Number(latencyMs.toFixed(2)),
      costUsd: null,
      top3: topChunks,
      error: null,
    });

    if (verbose) {
      const marker = matched ? "PASS" : "FAIL";
      console.log(
        `[rag:db] ${marker} ${testCase.id} rank=${rank ?? "miss"} latency=${results.at(-1).latencyMs}ms`
      );
    }
  }

  return {
    mode: "db",
    metrics: summarizeRagResults(results, {
      costNote:
        "Live pgvector retrieval does not expose embedding token usage, so per-query cost is not reported in db mode.",
    }),
    cases: results,
  };
}

export async function runRagSuite(cases, options = {}) {
  const chunks = loadChunks();
  const requestedMode = options.mode || "auto";
  const chosen = await chooseRagMode(requestedMode);
  const verbose = Boolean(options.verbose);

  if (chosen.mode === "db") {
    const suite = await runDbSuite(cases, verbose);
    return { ...suite, warnings: chosen.warnings };
  }

  if (chosen.mode === "embed") {
    try {
      const suite = await runEmbedSuite(cases, chunks, verbose);
      return { ...suite, warnings: chosen.warnings };
    } catch (err) {
      const warnings = [
        ...chosen.warnings,
        `Embedding retrieval failed (${err?.message || err}). Falling back to keyword retrieval.`,
      ];
      const suite = await runKeywordSuite(cases, chunks, verbose);
      return { ...suite, warnings };
    }
  }

  const suite = await runKeywordSuite(cases, chunks, verbose);
  return { ...suite, warnings: chosen.warnings };
}
