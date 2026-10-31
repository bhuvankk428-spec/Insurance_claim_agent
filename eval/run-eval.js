import path from "node:path";
import { hasRealOpenAIKey, resolveFromRoot } from "./lib/env.js";
import {
  DEFAULT_CASES_PATH,
  loadCaseFile,
  splitCases,
  validateCaseFile,
} from "./lib/cases.js";
import { runClaimSuite } from "./lib/claim.js";
import { runImageSuite } from "./lib/image.js";
import { runRagSuite } from "./lib/rag.js";
import { printRunSummary, writeRunReport } from "./lib/report.js";

function parseArgs(argv) {
  const options = {
    tag: null,
    suites: null,
    claimMode: "auto",
    ragMode: "auto",
    casesPath: DEFAULT_CASES_PATH,
    limit: null,
    verbose: false,
    noImages: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--tag") {
      options.tag = argv[index + 1];
      index += 1;
    } else if (arg === "--suite") {
      const values = String(argv[index + 1] || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      options.suites = options.suites || [];
      options.suites.push(...values);
      index += 1;
    } else if (arg === "--claim-mode") {
      options.claimMode = argv[index + 1];
      index += 1;
    } else if (arg === "--rag-mode") {
      options.ragMode = argv[index + 1];
      index += 1;
    } else if (arg === "--cases") {
      options.casesPath = path.resolve(process.cwd(), argv[index + 1]);
      index += 1;
    } else if (arg === "--limit") {
      options.limit = Number.parseInt(argv[index + 1], 10);
      index += 1;
    } else if (arg === "--verbose") {
      options.verbose = true;
    } else if (arg === "--no-images") {
      options.noImages = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.suites) {
    options.suites = ["claim", "image", "rag"];
  }

  if (options.claimMode === "auto") {
    options.claimMode = hasRealOpenAIKey() ? "ai" : "heuristic";
  }

  if (!["ai", "heuristic"].includes(options.claimMode)) {
    throw new Error("--claim-mode must be ai or heuristic");
  }

  if (!["auto", "db", "embed", "keyword"].includes(options.ragMode)) {
    throw new Error("--rag-mode must be auto, db, embed, or keyword");
  }

  return options;
}

function printHelp() {
  console.log(`Insure.AI evaluation runner

Usage:
  node eval/run-eval.js [options]

Options:
  --tag <name>            Label this run (default: timestamp)
  --suite <name>          claim, image, rag (repeatable/comma-separated)
  --claim-mode <mode>     ai or heuristic (default: ai when OPENAI_API_KEY exists)
  --rag-mode <mode>       auto, db, embed, keyword (default: auto)
  --cases <path>          Alternate case file
  --limit <n>             Limit cases per suite
  --verbose               Print per-case progress
  --no-images             Skip the image suite
  --help                  Show this help

Examples:
  node eval/run-eval.js --tag baseline
  node eval/run-eval.js --tag heuristic --claim-mode heuristic --rag-mode keyword
  node eval/run-eval.js --tag after-prompt --suite claim --rag-mode embed
`);
}

function makeRunId(tag) {
  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .replace("Z", "");
  const safeTag = String(tag || "run").replace(/[^a-z0-9._-]/gi, "_");
  return `${stamp}-${safeTag}`;
}

function applyLimit(cases, limit) {
  if (!limit || limit <= 0) return cases;
  return cases.slice(0, limit);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const tag = options.tag || "run";
  const caseFile = loadCaseFile(options.casesPath);
  const split = splitCases(caseFile);
  const validation = validateCaseFile(caseFile);

  if (validation.errors.length) {
    console.error("Case file validation failed:");
    for (const error of validation.errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  const requestedSuites = new Set(options.suites);
  const suites = {};
  const warnings = [];
  const startedAt = new Date().toISOString();

  if (requestedSuites.has("claim")) {
    const claimCases = applyLimit(split.claim, options.limit);
    console.log(
      `Running claim suite (${claimCases.length} cases, mode=${options.claimMode})...`
    );
    suites.claim = await runClaimSuite(claimCases, {
      mode: options.claimMode,
      scenarios: caseFile.scenarios,
      verbose: options.verbose,
    });
  }

  if (requestedSuites.has("image") && !options.noImages) {
    const imageCases = applyLimit(split.image, options.limit);
    console.log(`Running image suite (${imageCases.length} cases)...`);
    suites.image = await runImageSuite(imageCases, {
      scenarios: caseFile.scenarios,
      verbose: options.verbose,
    });
  }

  if (requestedSuites.has("rag")) {
    const ragCases = applyLimit(split.rag, options.limit);
    console.log(
      `Running RAG suite (${ragCases.length} cases, mode=${options.ragMode})...`
    );
    suites.rag = await runRagSuite(ragCases, {
      mode: options.ragMode,
      verbose: options.verbose,
    });
    warnings.push(...(suites.rag.warnings || []));
  }

  const finishedAt = new Date().toISOString();
  const run = {
    runId: makeRunId(tag),
    tag,
    startedAt,
    finishedAt,
    durationMs: new Date(finishedAt).getTime() - new Date(startedAt).getTime(),
    environment: {
      node: process.version,
      platform: process.platform,
      openaiConfigured: hasRealOpenAIKey(),
      claimMode: suites.claim?.mode || null,
      ragMode: suites.rag?.mode || null,
      claimModel: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
      visionModel: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
      embeddingModel:
        process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small",
      casesPath: path.relative(resolveFromRoot(), options.casesPath),
    },
    warnings: [...new Set(warnings)],
    suites,
  };

  const report = writeRunReport(run);
  printRunSummary(run);
  console.log(`JSON: ${path.relative(resolveFromRoot(), report.latestPath)}`);
  console.log(
    `Markdown: ${path.relative(resolveFromRoot(), report.latestMarkdownPath)}`
  );
  console.log(
    `History: ${path.relative(resolveFromRoot(), report.historyPath)}`
  );
  console.log(`Tagged: ${path.relative(resolveFromRoot(), report.latestTagPath)}`);
}

main().catch((err) => {
  console.error(err?.stack || err?.message || String(err));
  process.exitCode = 1;
});
