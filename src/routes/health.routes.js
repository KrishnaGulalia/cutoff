const { Router } = require("express");
function healthRoutes(database) {
  const router = Router();
  router.get("/", (req, res) => res.json({ status: "ok", app: "Cutoff" }));
  router.get("/db", async (req, res) => {
    try {
      await database.query("SELECT 1 FROM cutoff.tests LIMIT 1");
      res.json({ status: "ok" });
    } catch {
      res.status(503).json({
        error: "Database is not ready. Check the connection and migrations.",
      });
    }
  });
  return router;
}
module.exports = { healthRoutes };
