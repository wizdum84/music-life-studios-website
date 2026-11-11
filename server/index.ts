import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { randomUUID } from "node:crypto";
import { registerRoutes } from "./routes";
import { pool } from "./db";
import { operationalLog } from "./observability";
import { validateProductionConfiguration } from "./runtime-config";
import { startBookingEmailWorker } from "./services/booking-email-worker";
import { startBookingLifecycleWorker } from "./services/booking-lifecycle";
import { startBookingOperationsWorker } from "./services/booking-operations-worker";
import { startMembershipLifecycleWorker } from "./services/membership-lifecycle-worker";
import { setupVite, serveStatic } from "./vite";

const app = express();
const isProduction = process.env.NODE_ENV === "production";
if (isProduction) validateProductionConfiguration();
const publicMediaOrigin = (() => {
  try {
    const url = new URL(process.env.PUBLIC_MEDIA_BASE_URL || "");
    return url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
})();

app.disable("x-powered-by");
app.set("trust proxy", isProduction ? 1 : false);
app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://js.stripe.com"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://*.stripe.com", ...(publicMediaOrigin ? [publicMediaOrigin] : [])],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.stripe.com", "https://storage.googleapis.com", ...(publicMediaOrigin ? [publicMediaOrigin] : [])],
      mediaSrc: ["'self'", "blob:", ...(publicMediaOrigin ? [publicMediaOrigin] : [])],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "data:"],
    },
  } : false,
  crossOriginEmbedderPolicy: false,
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Please try again later." },
});

app.use((req, res, next) => {
  const requestId = req.get("x-request-id") || randomUUID();
  res.setHeader("X-Request-Id", requestId);
  res.locals.requestId = requestId;
  next();
});

// Stripe signs the raw webhook body, so this route must precede express.json().
app.use("/api/stripe/webhook", express.raw({ type: "application/json", limit: "1mb" }));
app.use(express.json({ limit: "512kb" }));
app.use(express.urlencoded({ extended: false, limit: "32kb" }));
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "music-life-studios" });
});
app.get("/api/ready", async (_req, res) => {
  try {
    await Promise.race([
      pool.query("select 1 as ready"),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Database readiness check timed out")), 5_000)),
    ]);
    res.status(200).json({ status: "ready", database: "connected" });
  } catch (error) {
    operationalLog("error", "readiness_check_failed", { error });
    res.status(503).json({ status: "not_ready", database: "unavailable" });
  }
});
app.use("/api", apiLimiter);
app.use([
  "/api/login", "/api/login/mfa", "/api/register", "/api/admin/setup",
  "/api/password/forgot", "/api/password/reset", "/api/email/verify", "/api/email/resend",
  "/api/admin/mfa/setup", "/api/admin/mfa/enable",
], authLimiter);

// Reject cross-site state-changing requests while allowing Stripe's server-to-server webhook.
app.use((req, res, next) => {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS" || req.path === "/api/stripe/webhook") {
    return next();
  }
  const origin = req.get("origin");
  if (!origin) return next();

  const configuredOrigin = process.env.APP_ORIGIN?.replace(/\/$/, "");
  const requestOrigin = `${req.protocol}://${req.get("host")}`.replace(/\/$/, "");
  const localOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (origin === configuredOrigin || origin === requestOrigin || (!isProduction && localOrigin)) return next();
  return res.status(403).json({ message: "Request origin is not allowed" });
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  res.on("finish", () => {
    if (path.startsWith("/api")) {
      operationalLog(res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info", "http_request", {
        requestId: res.locals.requestId,
        method: req.method,
        path,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
      });
    }
  });
  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = isProduction && status >= 500 ? "Internal Server Error" : (err.message || "Internal Server Error");
    operationalLog("error", "request_error", { requestId: res.locals.requestId, statusCode: status, error: err });
    if (!res.headersSent) res.status(status).json({ message });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT) || 5000;
  const listenOptions = {
    port,
    host: "0.0.0.0",
    ...(process.platform === "win32" ? {} : { reusePort: true }),
  };

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Set PORT to another value, for example: $env:PORT='5001'; npm run dev`);
      process.exit(1);
    }
    throw error;
  });

  server.listen(listenOptions, () => {
    startBookingEmailWorker();
    startBookingLifecycleWorker();
    startBookingOperationsWorker();
    startMembershipLifecycleWorker();
    operationalLog("info", "server_started", { port, environment: process.env.NODE_ENV || "development" });
  });

  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    operationalLog("info", "server_shutdown_started", { signal });
    server.close(async (error) => {
      if (error) operationalLog("error", "server_shutdown_failed", { error });
      try {
        await pool.end();
      } catch (poolError) {
        operationalLog("error", "database_pool_shutdown_failed", { error: poolError });
      }
      process.exit(error ? 1 : 0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
})();
