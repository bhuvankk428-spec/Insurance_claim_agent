import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import claimRoutes from "./routes/claim.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const app = express();
const PORT = process.env.CLAIM_PORT || 5174;

const corsOrigin =
  process.env.CORS_ORIGIN ||
  "http://localhost:5173,http://127.0.0.1:5173";
const allowedOrigins = corsOrigin
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes("*")) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH"],
  })
);
app.use(express.json());

app.use("/api", claimRoutes);

app.get("/", (_, res) => {
  res.send("Claim backend running");
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log("🔑 GROQ_API_KEY =", process.env.GROQ_API_KEY ? "LOADED" : "MISSING");
});
