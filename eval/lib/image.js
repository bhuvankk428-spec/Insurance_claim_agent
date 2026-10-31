import fs from "node:fs";
import path from "node:path";
import { hasRealOpenAIKey, resolveFromRoot } from "./env.js";
import { resolveScenario } from "./cases.js";
import { costFromTelemetry, roundUsd } from "./pricing.js";

const MIME_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function summarizeImageResponse(result) {
  if (!result || typeof result !== "object") {
    return { raw: result };
  }

  return {
    status: result.status || null,
    reason: result.reason || null,
    confidence: result.confidence ?? null,
    quality: result.quality || null,
  };
}

function summarizeImageResults(results) {
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
  const latencySum = evaluated.reduce(
    (total, result) => total + result.latencyMs,
    0
  );
  const aiCalls = evaluated.reduce(
    (total, result) => total + result.telemetry.calls,
    0
  );

  return {
    cases: results.length,
    evaluated: evaluated.length,
    skipped: results.length - evaluated.length,
    matched,
    accuracy: evaluated.length ? matched / evaluated.length : null,
    invalidJsonRate: jsonAttempts ? jsonInvalid / jsonAttempts : null,
    repairRate: jsonAttempts ? jsonRepaired / jsonAttempts : null,
    jsonAttempts,
    jsonInvalid,
    jsonRepaired,
    aiCalls,
    avgLatencyMs: evaluated.length ? latencySum / evaluated.length : null,
    totalCostUsd: roundUsd(totalCost),
    avgCostPerQueryUsd: evaluated.length
      ? roundUsd(totalCost / evaluated.length)
      : null,
  };
}

export async function runImageSuite(cases, options = {}) {
  const scenarios = options.scenarios || {};
  const verbose = Boolean(options.verbose);
  const openaiAvailable = hasRealOpenAIKey();
  const results = [];

  if (!openaiAvailable) {
    for (const testCase of cases) {
      results.push({
        id: testCase.id,
        type: testCase.type,
        expected: testCase.expected,
        predicted: "skipped",
        matched: false,
        skipped: true,
        reason: "OPENAI_API_KEY is not configured",
        latencyMs: 0,
        telemetry: {
          calls: 0,
          promptTokens: 0,
          completionTokens: 0,
          jsonAttempts: 0,
          jsonValid: 0,
          jsonRepaired: 0,
          jsonInvalid: 0,
        },
        costUsd: 0,
        actual: null,
      });
    }

    return {
      openaiConfigured: false,
      metrics: summarizeImageResults(results),
      cases: results,
    };
  }

  const { verifyIncidentWithVision } = await import(
    "../../backend/claimcheck/services/image.service.js"
  );
  const { resetAiTelemetry, getAiTelemetry } = await import(
    "../../backend/claimcheck/utils/aiTelemetry.js"
  );

  for (const testCase of cases) {
    const expected = testCase.expected;
    const imagePath = resolveFromRoot(testCase.input.imagePath);
    const extension = path.extname(imagePath).toLowerCase();
    const mimeType = MIME_TYPES[extension] || "image/jpeg";
    let buffer = null;
    let skillError = null;

    try {
      buffer = fs.readFileSync(imagePath);
    } catch (err) {
      skillError = err?.message || String(err);
    }

    if (!buffer) {
      results.push({
        id: testCase.id,
        type: testCase.type,
        expected,
        predicted: "skipped",
        matched: false,
        skipped: true,
        reason: skillError,
        latencyMs: 0,
        telemetry: {
          calls: 0,
          promptTokens: 0,
          completionTokens: 0,
          jsonAttempts: 0,
          jsonValid: 0,
          jsonRepaired: 0,
          jsonInvalid: 0,
        },
        costUsd: 0,
        actual: null,
      });
      continue;
    }

    const scenario = resolveScenario(testCase, scenarios);
    resetAiTelemetry();
    const startedAt = performance.now();
    let response = null;
    let error = null;

    try {
      response = await verifyIncidentWithVision({
        image: { buffer, mimetype: mimeType },
        incident: testCase.input.incident,
        domain: scenario.domain,
        policyData: scenario.policyData,
        firData: scenario.firData,
      });
    } catch (err) {
      error = err?.message || String(err);
    }

    const latencyMs = performance.now() - startedAt;
    const telemetry = getAiTelemetry();
    const { costUsd, knownCostUsd, unknownModels } =
      costFromTelemetry(telemetry);
    const predicted = error ? "error" : response?.status || "unknown";
    const matched = predicted === expected.status;

    results.push({
      id: testCase.id,
      type: testCase.type,
      expected,
      predicted,
      matched,
      skipped: false,
      latencyMs: Number(latencyMs.toFixed(2)),
      telemetry,
      costUsd,
      knownCostUsd: roundUsd(knownCostUsd),
      unknownCostModels: unknownModels,
      invalidJson: telemetry.jsonInvalid > 0,
      repairedJson: telemetry.jsonRepaired > 0,
      actual: summarizeImageResponse(response),
      error,
    });

    if (verbose) {
      const marker = matched ? "PASS" : "FAIL";
      console.log(
        `[image] ${marker} ${testCase.id} expected=${expected.status} predicted=${predicted} latency=${results.at(-1).latencyMs}ms`
      );
    }
  }

  return {
    openaiConfigured: true,
    metrics: summarizeImageResults(results),
    cases: results,
  };
}
