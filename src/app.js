const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const path = require("node:path");
const fs = require("node:fs");

const { prisma } = require("./lib/db");
const { requireAuth } = require("./middleware/auth");
const { errorHandler } = require("./lib/errors");
const { registerStudentRoutes } = require("./routes/student.routes");
const { registerHealthRoutes } = require("./routes/health.routes");

// ---------- Settings (read once, easy to find) ----------
const isProduction = process.env.NODE_ENV === "production";
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const supabaseOrigin = process.env.SUPABASE_URL
  ? new URL(process.env.SUPABASE_URL).origin
  : null;

// ---------- Small helper functions ----------

// 1. Basic app settings
function setupBasics(app) {
  // BigInt can't be turned into JSON, so send it as a string
  app.set("json replacer", (key, value) =>
    typeof value === "bigint" ? value.toString() : value,
  );

  // Don't reveal that we use Express
  app.disable("x-powered-by");

  // If running behind a reverse proxy, read the real client IP
  if (process.env.TRUST_PROXY) {
    app.set("trust proxy", process.env.TRUST_PROXY);
  }
}

// 2. Security headers + CORS + JSON body reading
function setupSecurity(app) {
  // Where the browser is allowed to connect (our server, and Supabase if set)
  const connectSrc = ["'self'"];
  if (supabaseOrigin) connectSrc.push(supabaseOrigin);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "connect-src": connectSrc,
          // On in production, removed in development
          "upgrade-insecure-requests": isProduction ? [] : null,
          "img-src": ["'self'", "https:", "data:"],
        },
      },
    }),
  );

  // Only our frontend may call this API from a browser
  app.use(cors({ origin: clientUrl }));

  // Read JSON bodies, max 32kb
  app.use(express.json({ limit: "32kb" }));
}

// 3. Limit requests: 240 per minute per client on /api
function setupRateLimit(app) {
  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 240,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many requests. Wait a moment and try again." },
  });

  app.use("/api", limiter);
}

// 4. API routes (order matters here!)
function setupApiRoutes(app) {
  // Public: anyone can check health
  registerHealthRoutes(app, prisma);

  // Everything after this line needs a logged-in user
  app.use("/api", requireAuth);

  // Protected routes
  registerStudentRoutes(app, prisma);

  // Any other /api URL = not found
  app.use("/api", (req, res) => {
    res.status(404).json({ error: "Endpoint not found." });
  });
}

// 5. Serve the built React app (only if it exists)
function setupFrontend(app) {
  const buildFolder = path.join(__dirname, "../client/dist");

  if (!fs.existsSync(buildFolder)) return;

  // Serve JS, CSS, images
  app.use(express.static(buildFolder));

  // For any other page, send index.html (so React routing works)
  app.get("/{*path}", (req, res) => {
    res.sendFile(path.join(buildFolder, "index.html"));
  });
}

// ---------- Main function ----------
function createApp() {
  const app = express();

  setupBasics(app);
  setupSecurity(app);
  setupRateLimit(app);
  setupApiRoutes(app);
  setupFrontend(app);

  // Error handler must always be last
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
