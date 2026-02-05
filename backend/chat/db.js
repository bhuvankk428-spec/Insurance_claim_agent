import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env"), quiet: true });
dotenv.config({ quiet: true });

export const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

