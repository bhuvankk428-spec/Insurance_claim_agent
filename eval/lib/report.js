import fs from "node:fs";
import path from "node:path";
import { resolveFromRoot } from "./env.js";

export const RESULTS_DIR = resolveFromRoot("eval", "results");
export const HISTORY_DIR = path.join(RESULTS_DIR, "history");

function ensureDirectories() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.mkdirSync(HISTORY_DIR, { recursive: true });
}

function formatNumber(value, digits = 3) {
  if (value === null || value === undefined) return "n/a";
  return Number(value).toFixed(digits);
}

function formatPercent(value) {
  if (value === null || value === undefined) return "n/a";
  return `${(Number(value) * 100).toFixed(1)}%`;
}

function formatUsd(value) {
  if (value === null || value === undefined) return "n/a";
  return `$${Number(value).toFixed(8)}`;
}

function formatMs(value) {
  if (value === null || value === undefined) return "n/a";
  return `${Number(value).toFixed(1)} ms`;
}

function suiteMetricRows(name, suite) {
  const metrics = suite?.metrics || {};

  if (name === "rag") {
    return [
      ["Cases", `${metrics.evaluated ?? 0} evaluated / ${metrics.cases ?? 0}`],
      ["Top-3 chunk hit rate", formatPercent(metrics.top3HitRate)],
      ["Top-1 chunk hit rate", formatPercent(metrics.top1HitRate)],
      ["MRR", formatNumber(metrics.mrr)],
      ["Avg latency", formatMs(metrics.avgLatencyMs)],
      ["Avg cost / query", formatUsd(metrics.avgCostPerQueryUsd)],
    ];
  }

  return [
    ["Cases", `${metrics.evaluated ?? 0} evaluated / ${metrics.cases ?? 0}`],
    ["Accuracy", formatPercent(metrics.accuracy)],
    ["Invalid JSON rate", formatPercent(metrics.invalidJsonRate)],
    ["JSON repair rate", formatPercent(metrics.repairRate)],
    ["Avg latency", formatMs(metrics.avgLatencyMs)],
    ["Avg cost / query", formatUsd(metrics.avgCostPerQueryUsd)],
  ];
}

function caseTable(name, suite) {
  const cases = suite?.cases || [];
  if (!cases.length) return [];

  const lines = [];

  if (name === "rag") {
    lines.push("| Case | Expected | Rank | Top-3 hit | Latency | Cost |");
    lines.push("| --- | --- | --- | --- | --- | --- |");
    for (const testCase of cases) {
      const expected = (testCase.expected?.chunks || [])
        .map((chunk) => `${chunk.policy_name} / ${chunk.section}`)
        .join("; ");
      lines.push(
        `| ${testCase.id} | ${expected} | ${testCase.rank ?? "miss"} | ${
          testCase.matched ? "yes" : "no"
        } | ${formatMs(testCase.latencyMs)} | ${formatUsd(
          testCase.costUsd
        )} |`
      );
    }
    return lines;
  }

  lines.push(
    "| Case | Expected | Predicted | Match | Latency | Cost | Invalid JSON | Repaired |"
  );
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const testCase of cases) {
    lines.push(
      `| ${testCase.id} | ${testCase.expected?.status ?? "n/a"} | ${
        testCase.predicted
      } | ${testCase.matched ? "yes" : "no"} | ${formatMs(
        testCase.latencyMs
      )} | ${formatUsd(testCase.costUsd)} | ${
        testCase.invalidJson ? "yes" : "no"
      } | ${testCase.repairedJson ? "yes" : "no"} |`
    );
  }
  return lines;
}

function buildMarkdown(run) {
  const lines = [];
  lines.push(`# Insure.AI Evaluation - ${run.tag}`);
  lines.push("");
  lines.push(`- Run ID: \`${run.runId}\``);
  lines.push(`- Started: ${run.startedAt}`);
  lines.push(`- Finished: ${run.finishedAt}`);
  lines.push(`- Claim mode: ${run.environment.claimMode || "n/a"}`);
  lines.push(`- RAG mode: ${run.environment.ragMode || "n/a"}`);
  lines.push(
    `- OpenAI configured: ${run.environment.openaiConfigured ? "yes" : "no"}`
  );
  lines.push("");

  for (const warning of run.warnings || []) {
    lines.push(`> Warning: ${warning}`);
    lines.push("");
  }

  for (const suiteName of ["claim", "image", "rag"]) {
    const suite = run.suites[suiteName];
    if (!suite) continue;

    lines.push(`## ${suiteName.toUpperCase()}`);
    lines.push("");
    lines.push("| Metric | Value |");
    lines.push("| --- | --- |");
    for (const [label, value] of suiteMetricRows(suiteName, suite)) {
      lines.push(`| ${label} | ${value} |`);
    }
    lines.push("");

    if (suite.mode || suite.embeddingModel) {
      lines.push(
        `Mode: ${suite.mode || "n/a"}${
          suite.embeddingModel ? ` (${suite.embeddingModel})` : ""
        }`
      );
      lines.push("");
    }

    if (suiteName === "claim" && suite.metrics?.confusionMatrix) {
      lines.push("Confusion matrix (expected -> predicted):");
      lines.push("");
      for (const [expected, predictions] of Object.entries(
        suite.metrics.confusionMatrix
      )) {
        const parts = Object.entries(predictions).map(
          ([predicted, count]) => `${predicted}=${count}`
        );
        lines.push(`- ${expected}: ${parts.join(", ")}`);
      }
      lines.push("");
    }

    const table = caseTable(suiteName, suite);
    if (table.length) {
      lines.push(...table);
      lines.push("");
    }
  }

  lines.push("## Limits");
  lines.push("");
  lines.push(
    "- Claim and image cases call the real service functions with fixed contexts; they do not upload a PDF or run OCR/EXIF."
  );
  lines.push(
    "- RAG db mode uses the real pgvector query and reports cost as n/a because token usage is not exposed."
  );
  lines.push(
    "- RAG embed mode reproduces vector retrieval locally against policy_chunks.json using the same embedding model; chunk vectors are cached."
  );
  lines.push(
    "- RAG keyword mode mirrors the production keyword fallback scorer and is deterministic."
  );
  lines.push(
    "- Invalid JSON is counted only for claim/image model responses. Unrecoverable JSON means the service used its safe fallback."
  );
  lines.push(
    "- Vision calls use the production temperature, so borderline image labels can change between runs. Repeat the image suite when the difference matters."
  );
  lines.push("");

  return lines.join("\n");
}

export function writeRunReport(run) {
  ensureDirectories();

  const historyPath = path.join(HISTORY_DIR, `${run.runId}.json`);
  const latestTagPath = path.join(
    RESULTS_DIR,
    `latest-${run.tag.replace(/[^a-z0-9._-]/gi, "_")}.json`
  );
  const latestPath = path.join(RESULTS_DIR, "latest.json");
  const markdown = buildMarkdown(run);
  const latestMarkdownPath = path.join(RESULTS_DIR, "latest.md");
  const tagMarkdownPath = path.join(
    RESULTS_DIR,
    `latest-${run.tag.replace(/[^a-z0-9._-]/gi, "_")}.md`
  );

  const serialized = JSON.stringify(run, null, 2);
  fs.writeFileSync(historyPath, serialized, "utf8");
  fs.writeFileSync(latestTagPath, serialized, "utf8");
  fs.writeFileSync(latestPath, serialized, "utf8");
  fs.writeFileSync(latestMarkdownPath, markdown, "utf8");
  fs.writeFileSync(tagMarkdownPath, markdown, "utf8");

  return {
    historyPath,
    latestTagPath,
    latestPath,
    latestMarkdownPath,
    tagMarkdownPath,
    markdown,
  };
}

export function printRunSummary(run) {
  console.log("");
  console.log(`Evaluation: ${run.tag} (${run.runId})`);
  console.log(
    `OpenAI configured: ${run.environment.openaiConfigured ? "yes" : "no"}`
  );
  console.log("");

  for (const warning of run.warnings || []) {
    console.log(`Warning: ${warning}`);
  }
  if (run.warnings?.length) console.log("");

  for (const suiteName of ["claim", "image", "rag"]) {
    const suite = run.suites[suiteName];
    if (!suite) continue;

    console.log(`[${suiteName}] mode=${suite.mode || "n/a"}`);
    for (const [label, value] of suiteMetricRows(suiteName, suite)) {
      console.log(`  ${label}: ${value}`);
    }
    console.log("");
  }
}
