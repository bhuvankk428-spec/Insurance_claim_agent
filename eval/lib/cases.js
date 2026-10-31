import fs from "node:fs";
import { resolveFromRoot } from "./env.js";

export const DEFAULT_CASES_PATH = resolveFromRoot(
  "eval",
  "cases",
  "insure-ai-eval-cases.json"
);

export const CLAIM_STATUSES = ["approved", "partial", "rejected", "invalid"];
export const IMAGE_STATUSES = ["ok", "partial", "reject", "skipped"];

export function loadCaseFile(filePath = DEFAULT_CASES_PATH) {
  const content = fs.readFileSync(filePath, "utf8");
  return JSON.parse(content);
}

export function splitCases(caseFile) {
  return {
    claim: caseFile.cases.filter((testCase) => testCase.type === "claim"),
    image: caseFile.cases.filter((testCase) => testCase.type === "image"),
    rag: caseFile.cases.filter((testCase) => testCase.type === "rag"),
  };
}

export function deepMerge(base, override) {
  if (Array.isArray(base) || Array.isArray(override)) {
    return override === undefined ? base : override;
  }

  if (
    !base ||
    typeof base !== "object" ||
    !override ||
    typeof override !== "object"
  ) {
    return override === undefined ? base : override;
  }

  const merged = { ...base };
  for (const [key, value] of Object.entries(override)) {
    merged[key] = deepMerge(base[key], value);
  }
  return merged;
}

export function resolveScenario(testCase, scenarios) {
  const scenarioName = testCase.input?.scenario;
  if (!scenarioName) {
    throw new Error(`Case ${testCase.id} is missing input.scenario`);
  }

  const base = scenarios?.[scenarioName];
  if (!base) {
    throw new Error(
      `Case ${testCase.id} references unknown scenario "${scenarioName}"`
    );
  }

  const resolved = deepMerge(base, testCase.input.overrides || {});
  return {
    ...resolved,
    createdAt: Date.now(),
  };
}

export function validateCaseFile(caseFile, options = {}) {
  const errors = [];
  const warnings = [];

  if (!caseFile || !Array.isArray(caseFile.cases)) {
    return {
      errors: ["Case file must contain a cases array"],
      warnings,
    };
  }

  if (caseFile.cases.length < 30 || caseFile.cases.length > 50) {
    errors.push(
      `Expected 30-50 cases, found ${caseFile.cases.length}`
    );
  }

  const ids = new Set();
  const scenarios = caseFile.scenarios || {};

  for (const testCase of caseFile.cases) {
    const label = testCase.id || "(missing id)";

    if (!testCase.id) {
      errors.push("A case is missing its id");
      continue;
    }
    if (ids.has(testCase.id)) {
      errors.push(`Duplicate case id: ${testCase.id}`);
    }
    ids.add(testCase.id);

    if (!["claim", "image", "rag"].includes(testCase.type)) {
      errors.push(`Case ${label} has invalid type "${testCase.type}"`);
      continue;
    }

    if (!testCase.expected || typeof testCase.expected !== "object") {
      errors.push(`Case ${label} is missing expected`);
      continue;
    }

    if (testCase.type === "claim") {
      if (!CLAIM_STATUSES.includes(testCase.expected.status)) {
        errors.push(
          `Case ${label} expected.status must be one of ${CLAIM_STATUSES.join(
            ", "
          )}`
        );
      }
      if (typeof testCase.expected.eligible !== "boolean") {
        errors.push(`Case ${label} expected.eligible must be boolean`);
      }
      if (!testCase.input?.scenario || !scenarios[testCase.input.scenario]) {
        errors.push(`Case ${label} references an unknown scenario`);
      }
      if (typeof testCase.input?.story !== "string") {
        errors.push(`Case ${label} is missing input.story`);
      } else if (
        testCase.expected.status !== "invalid" &&
        testCase.input.story.trim().length < 40
      ) {
        errors.push(
          `Case ${label} story is shorter than the service's 40-character minimum`
        );
      }
    }

    if (testCase.type === "image") {
      if (!IMAGE_STATUSES.includes(testCase.expected.status)) {
        errors.push(
          `Case ${label} expected.status must be one of ${IMAGE_STATUSES.join(
            ", "
          )}`
        );
      }
      if (!testCase.input?.scenario || !scenarios[testCase.input.scenario]) {
        errors.push(`Case ${label} references an unknown scenario`);
      }
      if (!testCase.input?.incident) {
        errors.push(`Case ${label} is missing input.incident`);
      }
      if (!testCase.input?.imagePath) {
        errors.push(`Case ${label} is missing input.imagePath`);
      } else {
        const imagePath = resolveFromRoot(testCase.input.imagePath);
        if (!fs.existsSync(imagePath)) {
          errors.push(
            `Case ${label} image not found: ${testCase.input.imagePath}`
          );
        }
      }
    }

    if (testCase.type === "rag") {
      if (!testCase.input?.question) {
        errors.push(`Case ${label} is missing input.question`);
      }
      if (
        !Array.isArray(testCase.expected.chunks) ||
        testCase.expected.chunks.length === 0
      ) {
        errors.push(`Case ${label} expects at least one chunk`);
      }
      if (options.chunks) {
        for (const expectedChunk of testCase.expected.chunks || []) {
          const found = options.chunks.some(
            (chunk) =>
              chunk.policy_name === expectedChunk.policy_name &&
              chunk.section === expectedChunk.section
          );
          if (!found) {
            errors.push(
              `Case ${label} expects a chunk that does not exist: ${expectedChunk.policy_name} / ${expectedChunk.section}`
            );
          }
        }
      }
    }
  }

  return { errors, warnings };
}
