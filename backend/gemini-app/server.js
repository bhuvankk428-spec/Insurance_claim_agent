import express from "express";
import cors from "cors";
import "dotenv/config";
import { askRAGStream } from "./rag.js";

const app = express();
const PORT = process.env.PORT || 5174;

app.use(cors());
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
