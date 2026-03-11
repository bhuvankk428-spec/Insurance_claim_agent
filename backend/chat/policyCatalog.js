import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "./data");

function loadPolicies() {
  const files = fs.readdirSync(DATA_DIR).filter((file) => file.endsWith(".json"));
  const policies = [];

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    if (Array.isArray(content)) {
      policies.push(...content);
    } else {
      policies.push(content);
    }
  }

  return policies;
}

const policies = loadPolicies();

export const policyByName = new Map(
  policies
    .filter((policy) => policy?.policy_name)
    .map((policy) => [policy.policy_name, policy])
);

export function getPolicyByName(policyName) {
  return policyByName.get(policyName) || null;
}
