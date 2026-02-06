import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");
const OUTPUT = path.resolve(__dirname, "../policy_chunks.json");

function isPrimitive(value) {
  return (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function addChunk({ chunks, domain, policyName, sectionPath, text }) {
  const cleanText = String(text || "").trim();
  if (!cleanText || cleanText.length < 30) return;
  chunks.push({
    domain,
    policy_name: policyName,
    section: sectionPath,
    text: `${sectionPath}: ${cleanText}`,
  });
}

function walkValue({ chunks, domain, policyName, value, pathParts }) {
  if (isPrimitive(value)) {
    addChunk({
      chunks,
      domain,
      policyName,
      sectionPath: pathParts.join("."),
      text: value,
    });
    return;
  }

  if (Array.isArray(value)) {
    const allPrimitive = value.every(isPrimitive);
    if (allPrimitive) {
      addChunk({
        chunks,
        domain,
        policyName,
        sectionPath: pathParts.join("."),
        text: value.join("; "),
      });
      return;
    }

    value.forEach((item, idx) => {
      walkValue({
        chunks,
        domain,
        policyName,
        value: item,
        pathParts: [...pathParts, `[${idx}]`],
      });
    });
    return;
  }

  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      walkValue({
        chunks,
        domain,
        policyName,
        value: child,
        pathParts: [...pathParts, key],
      });
    }
  }
}

function loadAllPolicies() {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  const policies = [];

  for (const file of files) {
    const content = JSON.parse(
      fs.readFileSync(path.join(DATA_DIR, file), "utf-8")
    );

    if (Array.isArray(content)) {
      policies.push(...content);
    } else {
      policies.push(content);
    }
  }

  return policies;
}

function buildChunks(policies) {
  const chunks = [];

  for (const policy of policies) {
    const domain = policy.domain || "Unknown";
    const policyName = policy.policy_name || "Unknown Policy";

    for (const [key, value] of Object.entries(policy)) {
      if (["domain", "policy_name", "insurer"].includes(key)) continue;
      walkValue({
        chunks,
        domain,
        policyName,
        value,
        pathParts: [key],
      });
    }
  }

  return chunks;
}

const policies = loadAllPolicies();
const chunks = buildChunks(policies);

fs.writeFileSync(OUTPUT, JSON.stringify(chunks, null, 2));
console.log(`✅ Built ${chunks.length} chunks`);
