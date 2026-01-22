import pg from "pg";
import "dotenv/config";

export const db = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});

await db.connect();
console.log("✅ DB connected");
