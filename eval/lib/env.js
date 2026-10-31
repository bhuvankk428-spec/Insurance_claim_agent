import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

export const ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

dotenv.config({ path: path.join(ROOT_DIR, ".env"), quiet: true });
dotenv.config({
  path: path.join(ROOT_DIR, ".env.local"),
  override: true,
  quiet: true,
});

export function hasRealOpenAIKey() {
  return Boolean(
    process.env.OPENAI_API_KEY &&
      !String(process.env.OPENAI_API_KEY).startsWith("your_")
  );
}

export function resolveFromRoot(...parts) {
  return path.join(ROOT_DIR, ...parts);
}
