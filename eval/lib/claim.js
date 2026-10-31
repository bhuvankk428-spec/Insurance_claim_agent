import { resolveScenario } from "./cases.js";
import { hasRealOpenAIKey } from "./env.js";
import { costFromTelemetry, roundUsd } from "./pricing.js";

const INVALID_REASON_PATTERNS = [
  "at least 2-3 sentences",
  "story or claim reference missing",
  "claim context missing",
];

function createMockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
  };
}

function categorizeClaimResponse(body) {
  if (!body || typeof body !== "object") return "error";

  const text = `${body.reason || ""} ${body.message || ""}`.toLowerCase();
  if (INVALID_REASON_PATTERNS.some((pattern) => text.includes(pattern))) {
    return "invalid";
  }

  if (body.eligible === false) return "rejected";
  if (body.eligibilityStatus === "approved") return "approved";
  if (
    body.eligibilityStatus === "partial" ||
    body.eligibilityStatus === "pending" ||
    body.level === "partial"
  ) {
    return "partial";
  }

  return "unknown";
}

function summarizeClaimResponse(body) {
  if (!body || typeof body !== "object") {
    return { raw: body };
  }

  return {
    eligible: body.eligible,
    eligibilityStatus: body.eligibilityStatus || null,
    level: body.level || null,
    riskLevel: body.riskLevel || null,
    claimCode: body.claimCode || null,
    reason: body.reason || body.message || null,
    explanation: body.explanation || null,
    reasons: Array.isArray(body.reasons) ? body.reasons.slice(0, 6) : [],
  };
}

function countConfusionMatrix(results) {
  const matrix = {};
  for (const result of results) {
    const expected = result.expected.status;
    const predicted = result.predicted;
    if (!matrix[expected]) matrix[expected] = {};
    matrix[expected][predicted] = (matrix[expected][predicted] || 0) + 1;
  }
  return matrix;
}

function summarizeClaims(results) {
  const evaluated = results.filter((result) => !result.skipped);
  const matched = evaluated.filter((result) => result.matched).length;
  const jsonAttempts = evaluated.reduce(
    (total, result) => total + result.telemetry.jsonAttempts,
    0
  );
  const jsonInvalid = evaluated.reduce(
    (total, result) => total + result.telemetry.jsonInvalid,
    0
  );
  const jsonRepaired = evaluated.reduce(
    (total, result) => total + result.telemetry.jsonRepaired,
    0
  );
  const totalCost = evaluated.reduce(
    (total, result) => total + (result.costUsd || 0),
    0
  );
  const knownCostCases = evaluated.filter(
    (result) => result.costUsd !== null
  ).length;
  const latencySum = evaluated.reduce(
    (total, result) => total + result.latencyMs,
    0
  );
  const aiCalls = evaluated.reduce(
    (total, result) => total + result.telemetry.calls,
    0
  );
  const promptTokens = evaluated.reduce(
    (total, result) => total + result.telemetry.promptTokens,
    0
  );
  const completionTokens = evaluated.reduce(
    (total, result) => total + result.telemetry.completionTokens,
    0
  );

  return {
    cases: results.length,
    evaluated: evaluated.length,
    matched,
    accuracy: evaluated.length ? matched / evaluated.length : null,
    invalidJsonRate: jsonAttempts ? jsonInvalid / jsonAttempts : null,
    repairRate: jsonAttempts ? jsonRepaired / jsonAttempts : null,
    jsonAttempts,
    jsonInvalid,
    jsonRepaired,
    aiCalls,
    promptTokens,
    completionTokens,
    avgLatencyMs: evaluated.length ? latencySum / evaluated.length : null,
    totalCostUsd: roundUsd(totalCost),
    avgCostPerQueryUsd: evaluated.length
      ? roundUsd(totalCost / evaluated.length)
      : null,
    costCoverage: evaluated.length ? knownCostCases / evaluated.length : null,
    confusionMatrix: countConfusionMatrix(evaluated),
  };
}

export async function runClaimSuite(cases, options = {}) {
  const mode = options.mode || "ai";
  const scenarios = options.scenarios || {};
  const verbose = Boolean(options.verbose);
  const originalEnv = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    REQUIRE_SUPABASE_READY: process.env.REQUIRE_SUPABASE_READY,
  };
  const openaiAvailable = hasRealOpenAIKey();

  process.env.SUPABASE_URL = "";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "";
  process.env.REQUIRE_SUPABASE_READY = "false";
  if (mode === "heuristic" || !openaiAvailable) {
    process.env.OPENAI_API_KEY = "";
  }

  const originalConsoleError = console.error;
  let suppressedLogs = 0;
  const suppressedPatterns = [
    "[claim-store] failed to persist claim",
    "[claim-store] failed to load claim",
    "Supabase save error: Supabase is not configured",
    "Supabase is not configured. Set SUPABASE_URL",
  ];

  console.error = (...args) => {
    const text = args
      .map((value) =>
        typeof value === "string" ? value : JSON.stringify(value)
      )
      .join(" ");
    if (suppressedPatterns.some((pattern) => text.includes(pattern))) {
      suppressedLogs += 1;
      return;
    }
    originalConsoleError(...args);
  };

  try {
    const { analyzeStory } = await import(
      "../../backend/claimcheck/services/story.service.js"
    );
    const { claimStore } = await import(
      "../../backend/claimcheck/store/claimStore.js"
    );
    const { resetAiTelemetry, getAiTelemetry } = await import(
      "../../backend/claimcheck/utils/aiTelemetry.js"
    );

    const results = [];

    for (const [index, testCase] of cases.entries()) {
      const expected = testCase.expected;
      const claimId = `eval-${testCase.id}-${index}-${Date.now()}`;
      const skipContext = Boolean(testCase.input?.skipContext);
      const res = createMockResponse();
      let error = null;
      let scenario = null;

      if (!skipContext) {
        scenario = resolveScenario(testCase, scenarios);
        claimStore.set(claimId, scenario);
      }

      resetAiTelemetry();
      const startedAt = performance.now();

      try {
        await analyzeStory(
          {
            body: {
              story: testCase.input?.story,
              claimId,
            },
          },
          res
        );
      } catch (err) {
        error = err?.message || String(err);
      } finally {
        claimStore.delete(claimId);
      }

      const latencyMs = performance.now() - startedAt;
      const telemetry = getAiTelemetry();
      const { costUsd, knownCostUsd, unknownModels } =
        costFromTelemetry(telemetry);
      const predicted = error
        ? "error"
        : categorizeClaimResponse(res.body);
      const eligibleMatches =
        typeof expected.eligible !== "boolean" ||
        res.body?.eligible === expected.eligible;
      const matched = predicted === expected.status && eligibleMatches;

      const result = {
        id: testCase.id,
        type: testCase.type,
        scenario: testCase.input?.scenario || null,
        expected,
        predicted,
        matched,
        latencyMs: Number(latencyMs.toFixed(2)),
        telemetry,
        costUsd,
        knownCostUsd: roundUsd(knownCostUsd),
        unknownCostModels: unknownModels,
        invalidJson: telemetry.jsonInvalid > 0,
        repairedJson: telemetry.jsonRepaired > 0,
        actual: summarizeClaimResponse(res.body),
        error,
      };

      results.push(result);

      if (verbose) {
        const marker = matched ? "PASS" : "FAIL";
        console.log(
          `[claim] ${marker} ${testCase.id} expected=${expected.status} predicted=${predicted} latency=${result.latencyMs}ms`
        );
      }
    }

    return {
      mode: mode === "heuristic" ? "heuristic" : "ai",
      openaiConfigured: openaiAvailable,
      suppressedSupabaseLogs: suppressedLogs,
      metrics: summarizeClaims(results),
      cases: results,
    };
  } finally {
    console.error = originalConsoleError;
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}
