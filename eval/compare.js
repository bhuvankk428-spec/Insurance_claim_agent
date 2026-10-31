import fs from "node:fs";
import path from "node:path";
import { resolveFromRoot } from "./lib/env.js";
import { HISTORY_DIR, RESULTS_DIR } from "./lib/report.js";

const FIELDS = {
  claim: [
    ["accuracy", "rate"],
    ["invalidJsonRate", "rate"],
    ["repairRate", "rate"],
    ["avgLatencyMs", "ms"],
    ["avgCostPerQueryUsd", "usd"],
    ["evaluated", "count"],
  ],
  image: [
    ["accuracy", "rate"],
    ["invalidJsonRate", "rate"],
    ["repairRate", "rate"],
    ["avgLatencyMs", "ms"],
    ["avgCostPerQueryUsd", "usd"],
    ["evaluated", "count"],
  ],
  rag: [
    ["top3HitRate", "rate"],
    ["top1HitRate", "rate"],
    ["mrr", "number"],
    ["avgLatencyMs", "ms"],
    ["avgCostPerQueryUsd", "usd"],
    ["evaluated", "count"],
  ],
};

function safeName(value) {
  return String(value).replace(/[^a-z0-9._-]/gi, "_");
}

function loadRun(arg) {
  const directPath = path.resolve(process.cwd(), arg);
  if (fs.existsSync(directPath)) {
    return JSON.parse(fs.readFileSync(directPath, "utf8"));
  }

  const latestTagPath = path.join(RESULTS_DIR, `latest-${safeName(arg)}.json`);
  if (fs.existsSync(latestTagPath)) {
    return JSON.parse(fs.readFileSync(latestTagPath, "utf8"));
  }

  if (fs.existsSync(HISTORY_DIR)) {
    const match = fs
      .readdirSync(HISTORY_DIR)
      .filter((file) => file.endsWith(".json") && file.includes(arg))
      .sort()
      .at(-1);
    if (match) {
      return JSON.parse(fs.readFileSync(path.join(HISTORY_DIR, match), "utf8"));
    }
  }

  throw new Error(`Could not find a run matching "${arg}"`);
}

function formatValue(value, type) {
  if (value === null || value === undefined) return "n/a";
  if (type === "rate") return `${(Number(value) * 100).toFixed(1)}%`;
  if (type === "ms") return `${Number(value).toFixed(1)} ms`;
  if (type === "usd") return `$${Number(value).toFixed(8)}`;
  if (type === "number") return Number(value).toFixed(3);
  return String(value);
}

function formatDelta(baseline, candidate, type) {
  if (
    baseline === null ||
    baseline === undefined ||
    candidate === null ||
    candidate === undefined
  ) {
    return "n/a";
  }

  const delta = Number(candidate) - Number(baseline);
  const sign = delta > 0 ? "+" : "";

  if (type === "rate") return `${sign}${(delta * 100).toFixed(1)} pp`;
  if (type === "ms") return `${sign}${delta.toFixed(1)} ms`;
  if (type === "usd") return `${sign}$${delta.toFixed(8)}`;
  if (type === "number") return `${sign}${delta.toFixed(3)}`;
  return `${sign}${delta}`;
}

function metricRows(baselineRun, candidateRun) {
  const rows = [];

  for (const suiteName of ["claim", "image", "rag"]) {
    const baselineSuite = baselineRun.suites?.[suiteName];
    const candidateSuite = candidateRun.suites?.[suiteName];
    if (!baselineSuite || !candidateSuite) continue;

    for (const [field, type] of FIELDS[suiteName]) {
      rows.push({
        suite: suiteName,
        metric: field,
        baseline: baselineSuite.metrics?.[field],
        candidate: candidateSuite.metrics?.[field],
        type,
        baselineText: formatValue(baselineSuite.metrics?.[field], type),
        candidateText: formatValue(candidateSuite.metrics?.[field], type),
        deltaText: formatDelta(
          baselineSuite.metrics?.[field],
          candidateSuite.metrics?.[field],
          type
        ),
      });
    }
  }

  return rows;
}

function changedCases(baselineRun, candidateRun) {
  const changes = [];

  for (const suiteName of ["claim", "image", "rag"]) {
    const baselineSuite = baselineRun.suites?.[suiteName];
    const candidateSuite = candidateRun.suites?.[suiteName];
    if (!baselineSuite || !candidateSuite) continue;

    const candidateById = new Map(
      (candidateSuite.cases || []).map((testCase) => [testCase.id, testCase])
    );

    for (const baselineCase of baselineSuite.cases || []) {
      const candidateCase = candidateById.get(baselineCase.id);
      if (!candidateCase) continue;

      const baselineValue = suiteName === "rag" ? baselineCase.rank : baselineCase.predicted;
      const candidateValue =
        suiteName === "rag" ? candidateCase.rank : candidateCase.predicted;

      if (baselineCase.matched !== candidateCase.matched) {
        changes.push({
          suite: suiteName,
          id: baselineCase.id,
          from: `${baselineCase.matched ? "hit" : "miss"} (${baselineValue ?? "miss"})`,
          to: `${candidateCase.matched ? "hit" : "miss"} (${candidateValue ?? "miss"})`,
        });
      }
    }
  }

  return changes;
}

function buildMarkdown(baselineRun, candidateRun, rows, changes) {
  const lines = [];
  lines.push(
    `# Insure.AI Evaluation Comparison: ${baselineRun.tag} -> ${candidateRun.tag}`
  );
  lines.push("");
  lines.push(`- Baseline: \`${baselineRun.runId}\``);
  lines.push(`- Candidate: \`${candidateRun.runId}\``);
  lines.push("");
  lines.push("| Suite | Metric | Baseline | Candidate | Delta |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const row of rows) {
    lines.push(
      `| ${row.suite} | ${row.metric} | ${row.baselineText} | ${row.candidateText} | ${row.deltaText} |`
    );
  }
  lines.push("");

  if (changes.length) {
    lines.push("## Changed Cases");
    lines.push("");
    lines.push("| Suite | Case | Baseline | Candidate |");
    lines.push("| --- | --- | --- | --- |");
    for (const change of changes) {
      lines.push(
        `| ${change.suite} | ${change.id} | ${change.from} | ${change.to} |`
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

function main() {
  const [baselineArg, candidateArg] = process.argv.slice(2);

  if (!baselineArg || !candidateArg) {
    console.error(
      "Usage: node eval/compare.js <baseline-tag-or-json> <candidate-tag-or-json>"
    );
    process.exitCode = 1;
    return;
  }

  const baselineRun = loadRun(baselineArg);
  const candidateRun = loadRun(candidateArg);
  const rows = metricRows(baselineRun, candidateRun);
  const changes = changedCases(baselineRun, candidateRun);

  console.log(
    `Comparing ${baselineRun.tag} (${baselineRun.runId}) -> ${candidateRun.tag} (${candidateRun.runId})`
  );
  console.log("");
  console.log(
    "| Suite | Metric | Baseline | Candidate | Delta |"
  );
  console.log("| --- | --- | --- | --- | --- |");
  for (const row of rows) {
    console.log(
      `| ${row.suite} | ${row.metric} | ${row.baselineText} | ${row.candidateText} | ${row.deltaText} |`
    );
  }

  if (changes.length) {
    console.log("");
    console.log("Changed cases:");
    for (const change of changes) {
      console.log(
        `- [${change.suite}] ${change.id}: ${change.from} -> ${change.to}`
      );
    }
  }

  const markdown = buildMarkdown(baselineRun, candidateRun, rows, changes);
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const outputPath = path.join(
    RESULTS_DIR,
    `compare-${safeName(baselineRun.tag)}-${safeName(candidateRun.tag)}.md`
  );
  fs.writeFileSync(outputPath, markdown, "utf8");
  console.log("");
  console.log(`Markdown: ${path.relative(resolveFromRoot(), outputPath)}`);
}

main();
