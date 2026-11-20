function registerHealthRoutes(app, database) {
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "Cutoff" });
  });

  app.get("/api/health/db", async (req, res) => {
    try {
      await database.test.findFirst({ select: { test_id: true } });
      res.json({ status: "ok" });
    } catch {
      res.status(503).json({
        error: "Database is not ready. Check the connection and migrations.",
      });
    }
  });
}

module.exports = { registerHealthRoutes };
