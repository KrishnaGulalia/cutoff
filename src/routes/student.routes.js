const { Router } = require("express");
const { id, answerInput } = require("../lib/validation");
const { AppError } = require("../lib/errors");
const { listPapers, getPaper } = require("../services/papers");
const {
  startAttempt,
  getAttempt,
  submitAttempt,
} = require("../services/attempts");
const { saveAnswer } = require("../services/answers");
const { getResult } = require("../services/results");
const { getHistory } = require("../services/history");
function studentRoutes(database) {
  const router = Router();
  router.get("/me", async (req, res) => {
    const profile = await database.user.findUnique({
      where: { user_id: req.user.id },
    });
    res.json({ ...profile, email: req.user.email });
  });
  router.patch("/me", async (req, res) => {
    const name = req.body?.name;
    if (typeof name !== "string" || !name.trim() || name.trim().length > 80)
      throw new AppError(400, "Use a name between 1 and 80 characters.");
    const profile = await database.user.update({
      where: { user_id: req.user.id },
      data: { user_name: name.trim() },
    });
    res.json(profile);
  });
  router.get("/papers", async (req, res) =>
    res.json(await listPapers(database, req.query)),
  );
  router.get("/papers/:id", async (req, res) =>
    res.json(await getPaper(database, id(req.params.id))),
  );
  router.post("/papers/:id/attempts", async (req, res) =>
    res.json(await startAttempt(database, req.user.id, id(req.params.id))),
  );
  router.get("/attempts", async (req, res) =>
    res.json(await getHistory(database, req.user.id)),
  );
  router.get("/attempts/:id", async (req, res) =>
    res.json(await getAttempt(database, req.user.id, id(req.params.id))),
  );
  router.put("/attempts/:id/answers/:questionId", async (req, res) =>
    res.json(
      await saveAnswer(
        database,
        req.user.id,
        id(req.params.id),
        id(req.params.questionId),
        answerInput(req.body),
      ),
    ),
  );
  router.post("/attempts/:id/submit", async (req, res) =>
    res.json(await submitAttempt(database, req.user.id, id(req.params.id))),
  );
  router.get("/attempts/:id/results", async (req, res) =>
    res.json(await getResult(database, req.user.id, id(req.params.id))),
  );
  return router;
}
module.exports = { studentRoutes };
