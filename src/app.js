const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const path = require('node:path');
const fs = require('node:fs');
const { getPool } = require('./lib/db');
const { verifyToken } = require('./lib/supabase');
const { requireAuth } = require('./middleware/auth');
const { errorHandler } = require('./lib/errors');
const { studentRoutes } = require('./routes/student.routes');
const { healthRoutes } = require('./routes/health.routes');
function createApp(options = {}) {
  const app = express();
  const database = options.database || { query: (...args) => getPool().query(...args), connect: () => getPool().connect() };
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: { directives: {
    'connect-src': ["'self'", 'https://*.supabase.co'], 'img-src': ["'self'", 'https:', 'data:']
  } } }));
  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
  app.use(express.json({ limit: '32kb' }));
  app.use('/api', rateLimit({ windowMs: 60000, limit: 240, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: 'Too many requests. Wait a moment and try again.' } }));
  app.use('/api/health', healthRoutes(database));
  app.use('/api', requireAuth(database, options.verifyToken || verifyToken), studentRoutes(database));
  app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint not found.' }));
  const build = path.join(__dirname, '../client/dist');
  if (fs.existsSync(build)) {
    app.use(express.static(build));
    app.get('/{*path}', (req, res) => res.sendFile(path.join(build, 'index.html')));
  }
  app.use(errorHandler);
  return app;
}
module.exports = { createApp };
