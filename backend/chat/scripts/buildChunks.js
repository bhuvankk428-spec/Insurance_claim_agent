import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

// helper: safely convert anything to text
function toText(value) {
  if (!value) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") {
    return Object.values(value).map(toText).join(" ");
  }
  return String(value);
}

// load all json files
function loadAllPolicies() {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".json"));
  let policies = [];

  for (const file of files) {
    const content = JSON.parse(
      fs.readFileSync(path.join(DATA_DIR, file), "utf-8")
    );

    // ✅ SUPPORT both array and single object
    if (Array.isArray(content)) {
      policies.push(...content);
    } else {
      policies.push(content);
    }
  }

  return policies;
}

// convert policies → chunks
function buildChunks(policies) {
  const chunks = [];

  for (const policy of policies) {
    const domain = policy.domain || "Unknown";
    const policyName = policy.policy_name || "Unknown Policy";

    for (const [key, value] of Object.entries(policy)) {
      if (["domain", "policy_name", "insurer"].includes(key)) continue;

      const text = toText(value).trim();
      if (!text || text.length < 30) continue;

      chunks.push({
        domain,
        policy_name: policyName,
        section: key,
        text,
      });
    }
  }

  return chunks;
}

// RUN
const policies = loadAllPolicies();
const chunks = buildChunks(policies);

// SAVE
fs.writeFileSync(
  "policy_chunks.json",
  JSON.stringify(chunks, null, 2)
);

console.log(`✅ Built ${chunks.length} chunks`);
