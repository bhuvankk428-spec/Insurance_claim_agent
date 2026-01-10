// backend/buildIndex.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { embed } from "./embedClient.js";
import { saveVector } from "./vectorStore.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const POLICY_DIR = path.join(__dirname, "policy");
const CACHE_FILE = path.join(__dirname, "vector-cache.json");

export async function buildIndex() {
  // 🔒 SAFE CACHE LOAD
  if (fs.existsSync(CACHE_FILE)) {
    const raw = fs.readFileSync(CACHE_FILE, "utf8").trim();

    if (raw.length > 0) {
      try {
        const cached = JSON.parse(raw);
        cached.forEach(saveVector);
        console.log("✅ Loaded vectors from cache:", cached.length);
        return;
      } catch (err) {
        console.warn("⚠️ Corrupted cache detected. Rebuilding...");
        fs.unlinkSync(CACHE_FILE);
      }
    } else {
      // empty file
      fs.unlinkSync(CACHE_FILE);
    }
  }

  // 🔄 BUILD NEW INDEX
  const vectors = [];

  const files = fs.readdirSync(POLICY_DIR).filter(f => f.endsWith(".json"));

  for (const file of files) {
    const policies = JSON.parse(
      fs.readFileSync(path.join(POLICY_DIR, file), "utf8")
    );

    for (const policy of policies) {
      const text = JSON.stringify(policy);
      const embedding = await embed(text);

      vectors.push({
        id: `${file}-${policy.policy_name}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_"),
        domain: policy.domain || null,
        policy_name: policy.policy_name || null,
        insurer: policy.insurer || null,
        text,
        embedding
      });
    }
  }

  fs.writeFileSync(CACHE_FILE, JSON.stringify(vectors, null, 2));
  vectors.forEach(saveVector);

  console.log("✅ Index built and cached:", vectors.length);
}
