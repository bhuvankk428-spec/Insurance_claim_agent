import crypto from "crypto";
import pinoHttp from "pino-http";
import app, { preflight } from "./app.js";

const logger = pinoHttp({
  genReqId: (req) => req.headers["x-request-id"] || crypto.randomUUID(),
  redact: ["req.headers.authorization", "req.headers.cookie"],
});

const PORT = process.env.PORT || process.env.CLAIM_PORT || 5174;

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
