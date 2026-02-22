import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import crypto from "crypto";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env"), quiet: true });
dotenv.config({
  path: path.resolve(__dirname, "../../.env.local"),
  override: true,
  quiet: true,
});
dotenv.config({ quiet: true });

const [{ default: claimRoutes }, { ensureSupabase }, { fetchFinanceNews }] =
  await Promise.all([
    import("./routes/claim.routes.js"),
    import("./services/supabase.service.js"),
    import("./services/news.service.js"),
  ]);

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");

const logger = pinoHttp({
  genReqId: (req) => req.headers["x-request-id"] || crypto.randomUUID(),
  redact: ["req.headers.authorization", "req.headers.cookie"],
});

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
  methods: ["GET", "POST", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-Admin-Token"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(logger);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));

app.get("/api/finance-news", fetchFinanceNews);

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

export function preflight() {
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

export default app;
