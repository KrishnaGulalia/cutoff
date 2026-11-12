const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const path = require("node:path");
const fs = require("node:fs");
const { prisma } = require("./lib/db");
const { verifyToken } = require("./lib/supabase");
const { requireAuth } = require("./middleware/auth");
const { errorHandler } = require("./lib/errors");
const { studentRoutes } = require("./routes/student.routes");
const { healthRoutes } = require("./routes/health.routes");
function createApp(options = {}) {
  const app = express();
  const database = options.database || prisma;
  // The API sends PostgreSQL bigint IDs as strings so browsers preserve precision.
  app.set("json replacer", (key, value) =>
    typeof value === "bigint" ? value.toString() : value,
  );
  app.disable("x-powered-by");
  // A host can specify the address or subnet of its reverse proxy.
  if (process.env.TRUST_PROXY) app.set("trust proxy", process.env.TRUST_PROXY);
  const authOrigin = process.env.SUPABASE_URL
    ? new URL(process.env.SUPABASE_URL).origin
    : null;
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "connect-src": authOrigin ? ["'self'", authOrigin] : ["'self'"],
          "upgrade-insecure-requests":
            process.env.NODE_ENV === "production" ? [] : null,
          "img-src": ["'self'", "https:", "data:"],
        },
      },
    }),
  );
  app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
  app.use(express.json({ limit: "32kb" }));
  app.use(
    "/api",
    rateLimit({
      windowMs: 60000,
      limit: 240,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "Too many requests. Wait a moment and try again." },
    }),
  );
  app.use("/api/health", healthRoutes(database));
  app.use(
    "/api",
    requireAuth(database, options.verifyToken || verifyToken),
    studentRoutes(database),
  );
  app.use("/api", (req, res) =>
    res.status(404).json({ error: "Endpoint not found." }),
  );
  const build = path.join(__dirname, "../client/dist");
  if (fs.existsSync(build)) {
    app.use(express.static(build));
    app.get("/{*path}", (req, res) =>
      res.sendFile(path.join(build, "index.html")),
    );
  }
  app.use(errorHandler);
  return app;
}
module.exports = { createApp };
