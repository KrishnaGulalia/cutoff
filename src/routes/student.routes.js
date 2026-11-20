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

function registerStudentRoutes(app, database) {
  app.get("/api/me", async (req, res) => {
    const profile = await database.user.findUnique({
      where: { user_id: req.user.id },
    });
    res.json({ ...profile, email: req.user.email });
  });

  app.patch("/api/me", async (req, res) => {
    const name = req.body?.name;
    if (typeof name !== "string" || !name.trim() || name.trim().length > 80) {
      throw new AppError(400, "Use a name between 1 and 80 characters.");
    }

    const profile = await database.user.update({
      where: { user_id: req.user.id },
      data: { user_name: name.trim() },
    });
    res.json(profile);
  });

  app.get("/api/papers", async (req, res) => {
    const papers = await listPapers(database, req.query);
    res.json(papers);
  });

  app.get("/api/papers/:id", async (req, res) => {
    const paperId = id(req.params.id);
    const paper = await getPaper(database, paperId);
    res.json(paper);
  });

  app.post("/api/papers/:id/attempts", async (req, res) => {
    const paperId = id(req.params.id);
    const attempt = await startAttempt(database, req.user.id, paperId);
    res.json(attempt);
  });

  app.get("/api/attempts", async (req, res) => {
    const history = await getHistory(database, req.user.id);
    res.json(history);
  });

  app.get("/api/attempts/:id", async (req, res) => {
    const attemptId = id(req.params.id);
    const attempt = await getAttempt(database, req.user.id, attemptId);
    res.json(attempt);
  });

  app.put("/api/attempts/:id/answers/:questionId", async (req, res) => {
    const attemptId = id(req.params.id);
    const questionId = id(req.params.questionId);
    const answer = answerInput(req.body);
    const saved = await saveAnswer(
      database,
      req.user.id,
      attemptId,
      questionId,
      answer,
    );
    res.json(saved);
  });

  app.post("/api/attempts/:id/submit", async (req, res) => {
    const attemptId = id(req.params.id);
    const attempt = await submitAttempt(database, req.user.id, attemptId);
    res.json(attempt);
  });

  app.get("/api/attempts/:id/results", async (req, res) => {
    const attemptId = id(req.params.id);
    const result = await getResult(database, req.user.id, attemptId);
    res.json(result);
  });
}

module.exports = { registerStudentRoutes };
