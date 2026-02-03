import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { askRAGStream } from "./rag.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const app = express();
const PORT = process.env.CHAT_PORT || process.env.PORT || 5174;
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
    methods: ["GET", "POST"],
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.send("RAG API running ✅");
});

app.post("/api/rag-chat", async (req, res) => {
  try {
    const { question, domain, details } = req.body;

    if (!question) {
      return res.status(400).end("Question is required");
    }

    // 🔑 Required for streaming
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");

    await askRAGStream({
      question,
      domain,
      details,
      onToken: (token) => {
        res.write(token);
      },
    });

    res.end();
  } catch (err) {
    if (err?.name === "AbortError") {
      res.write(
        "\n\n⚠️ The response is taking longer than expected. Please try again."
      );
      return res.end();
    }

    console.error("🔥 STREAM ERROR:", err);
    if (!res.headersSent) {
      res.status(500).end("RAG streaming failed");
    } else {
      res.end();
    }
  }
});

app.listen(PORT, () => {
  console.log(`🚀 RAG server running on http://localhost:${PORT}`);
});
