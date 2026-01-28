import pg from "pg";
import "dotenv/config";

export const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

console.log("✅ DB pool ready");
