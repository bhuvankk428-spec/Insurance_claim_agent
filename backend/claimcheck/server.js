import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import crypto from "crypto";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import claimRoutes from "./routes/claim.routes.js";
import { ensureSupabase } from "./services/supabase.service.js";

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

const PORT = process.env.PORT || process.env.CLAIM_PORT || 5174;

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
app.use(logger);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));

const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
  max: Number(process.env.RATE_LIMIT_MAX || 60),
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

app.use("/api", claimRoutes);

app.use((err, _req, res, _next) => {
  if (err?.name === "MulterError") {
    return res.status(400).json({
      status: "error",
      message: err.message || "Upload error",
    });
  }
  res.status(500).json({ status: "error", message: "Server error" });
});

app.get("/", (_, res) => {
  res.send("Claim backend running");
});

app.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/readyz", (_req, res) => {
  try {
    ensureSupabase();
    res.json({ status: "ready" });
  } catch (err) {
    res.status(503).json({ status: "not_ready", error: err.message });
  }
});

const REQUIRE_SUPABASE_READY =
  String(process.env.REQUIRE_SUPABASE_READY || "true").toLowerCase() === "true";

function preflight() {
  if (process.env.NODE_ENV === "production") {
    const adminToken = process.env.ADMIN_TOKEN;
    if (!adminToken || adminToken === "qk-admin-2026") {
      throw new Error("ADMIN_TOKEN must be set in production");
    }
  }
  if (REQUIRE_SUPABASE_READY) {
    ensureSupabase();
  }
}

let server;
try {
  preflight();
  server = app.listen(PORT, () => {});
} catch (err) {
  logger.logger.error({ err }, "startup_preflight_failed");
  process.exit(1);
}

function shutdown(signal) {
  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
  setTimeout(() => process.exit(1), 5000).unref();
  logger.logger.info({ signal }, "shutdown");
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
