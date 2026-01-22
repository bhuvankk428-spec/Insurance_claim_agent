import express from "express";
import cors from "cors";
import "dotenv/config";
import { askRAG } from "./rag.js";

const app = express();
const PORT = process.env.PORT || 5174;

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("RAG API running ✅");
});

// RAG chat endpoint
app.post("/api/rag-chat", async (req, res) => {
  try {
    const { question, domain } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const result = await askRAG({ question, domain });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "RAG processing failed" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 RAG server running on http://localhost:${PORT}`);
});

