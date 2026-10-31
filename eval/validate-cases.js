import fs from "node:fs";
import { resolveFromRoot } from "./lib/env.js";
import {
  DEFAULT_CASES_PATH,
  loadCaseFile,
  splitCases,
  validateCaseFile,
} from "./lib/cases.js";

const casePath = process.argv[2]
  ? resolveFromRoot(process.argv[2])
  : DEFAULT_CASES_PATH;
const chunksPath = resolveFromRoot("backend", "chat", "policy_chunks.json");
const chunks = fs.existsSync(chunksPath)
  ? JSON.parse(fs.readFileSync(chunksPath, "utf8"))
  : [];

const caseFile = loadCaseFile(casePath);
const split = splitCases(caseFile);
const result = validateCaseFile(caseFile, { chunks });

console.log(`Case file: ${casePath}`);
console.log(
  `Cases: ${caseFile.cases.length} (claim=${split.claim.length}, image=${split.image.length}, rag=${split.rag.length})`
);

if (result.warnings.length) {
  for (const warning of result.warnings) {
    console.log(`Warning: ${warning}`);
  }
}

if (result.errors.length) {
  console.error("Validation failed:");
  for (const error of result.errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log("Validation passed.");
}
