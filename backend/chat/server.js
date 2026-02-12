import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { z } from "zod";
import { askRAGStream } from "./rag.js";
import { db } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env"), quiet: true });
dotenv.config({
  path: path.resolve(__dirname, "../../.env.local"),
  override: true,
  quiet: true,
});
dotenv.config({ quiet: true });

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");

const logger = pinoHttp({
  genReqId: (req) => req.headers["x-request-id"] || crypto.randomUUID(),
  redact: ["req.headers.authorization", "req.headers.cookie"],
});

const PORT = process.env.CHAT_PORT || process.env.PORT || 5174;
const corsOrigin =
  process.env.CORS_ORIGIN ||
  "http://localhost:5173,http://127.0.0.1:5173";
const allowedOrigins = corsOrigin
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, "").toLowerCase())
  .filter(Boolean);

function isOriginAllowed(origin) {
  if (!origin) return true;
  const normalized = origin.replace(/\/$/, "").toLowerCase();
  if (allowedOrigins.includes("*")) return true;
  if (allowedOrigins.includes(normalized)) return true;

  return allowedOrigins.some((allowed) => {
    if (!allowed.includes("*")) return false;
    const regexPattern = allowed
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*");
    const regex = new RegExp(`^${regexPattern}$`, "i");
    return regex.test(normalized);
  });
}

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-Admin-Token"],
  optionsSuccessStatus: 204,
};

app.use(logger);
app.use(helmet());
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.send("RAG API running ✅");
});

app.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/readyz", async (_req, res) => {
  try {
    await Promise.race([
      db.query("SELECT 1"),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DB timeout")), 2000)
      ),
    ]);
    res.json({
      status: "ready",
      openai_configured: Boolean(process.env.OPENAI_API_KEY),
    });
  } catch (err) {
    res.status(503).json({ status: "not_ready", error: err.message });
  }
});

const ragLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
  max: Number(process.env.RATE_LIMIT_MAX || 60),
  standardHeaders: true,
  legacyHeaders: false,
});

const ragSchema = z.object({
  question: z.string().min(3).max(2000),
  domain: z.string().max(100).optional(),
  language: z.enum(["en", "hi", "te", "kn"]).optional(),
  details: z
    .union([z.record(z.string(), z.any()), z.string()])
    .optional()
    .transform((val) => (typeof val === "string" ? { text: val } : val)),
});

app.post("/api/rag-chat", ragLimiter, async (req, res) => {
  try {
    const parsed = ragSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { question, domain, details, language } = parsed.data;

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Request-Id", req.id);

    await askRAGStream({
      question,
      domain,
      language,
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

    req.log.error({ err }, "stream_error");
    if (!res.headersSent) {
      const status = err?.status || 500;
      res.status(status).end(err?.message || "RAG streaming failed");
    } else {
      res.end();
    }
  }
});

const REQUIRE_DB_READY =
  String(process.env.REQUIRE_DB_READY || "true").toLowerCase() === "true";
const STARTUP_DB_TIMEOUT_MS = Number(
  process.env.STARTUP_DB_TIMEOUT_MS || 5000
);

async function preflight() {
  if (!REQUIRE_DB_READY) return;
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
  }
  await Promise.race([
    db.query("SELECT 1"),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("DB timeout")), STARTUP_DB_TIMEOUT_MS)
    ),
  ]);
}

let server;
preflight()
  .then(() => {
    server = app.listen(PORT, () => {});
  })
  .catch((err) => {
    logger.logger.error({ err }, "startup_preflight_failed");
    process.exit(1);
  });

function shutdown(signal) {
  if (server) {
    server.close(() => {
      db.end().finally(() => process.exit(0));
    });
  } else {
    db.end().finally(() => process.exit(0));
  }
  setTimeout(() => process.exit(1), 5000).unref();
  logger.logger.info({ signal }, "shutdown");
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
