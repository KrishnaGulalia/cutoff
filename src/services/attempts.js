const { transaction } = require("../lib/db");
const { AppError } = require("../lib/errors");
const { getPaper } = require("./papers");
const { getQuestions } = require("./questions");
async function ownedAttempt(client, userId, attemptId) {
  const result = await client.query(
    `SELECT attempt.*, paper.test_title, paper.duration_minutes,
    attempt.started_at + paper.duration_minutes * INTERVAL '1 minute' AS expires_at,
    clock_timestamp() AS server_now,
    clock_timestamp() >= attempt.started_at + paper.duration_minutes * INTERVAL '1 minute' AS expired
    FROM cutoff.attempts AS attempt JOIN cutoff.tests AS paper ON paper.test_id = attempt.test_id
    WHERE attempt.user_id = $1 AND attempt.attempt_id = $2 FOR UPDATE OF attempt`,
    [userId, attemptId],
  );
  if (!result.rowCount) throw new AppError(404, "Attempt not found.");
  return result.rows[0];
}
async function closeAttempt(client, attempt) {
  if (attempt.attempt_status === "SUBMITTED") return attempt;
  const result = await client.query(
    `UPDATE cutoff.attempts SET attempt_status = 'SUBMITTED',
    submitted_at = clock_timestamp() WHERE attempt_id = $1 RETURNING submitted_at`,
    [attempt.attempt_id],
  );
  return {
    ...attempt,
    attempt_status: "SUBMITTED",
    submitted_at: result.rows[0].submitted_at,
  };
}
async function startAttempt(database, userId, testId) {
  return transaction(database, async (client) => {
    await getPaper(client, testId);
    // Lock the student to make two simultaneous start requests share one attempt.
    await client.query(
      "SELECT user_id FROM cutoff.users WHERE user_id = $1 FOR UPDATE",
      [userId],
    );
    const active = await client.query(
      `SELECT attempt_id FROM cutoff.attempts
      WHERE user_id = $1 AND test_id = $2 AND attempt_status = 'IN_PROGRESS'`,
      [userId, testId],
    );
    if (active.rowCount) {
      const attempt = await ownedAttempt(
        client,
        userId,
        active.rows[0].attempt_id,
      );
      if (!attempt.expired) return attempt;
      await closeAttempt(client, attempt);
    }
    const created = await client.query(
      "INSERT INTO cutoff.attempts(user_id, test_id) VALUES ($1, $2) RETURNING attempt_id",
      [userId, testId],
    );
    return ownedAttempt(client, userId, created.rows[0].attempt_id);
  });
}
async function getAttempt(database, userId, attemptId) {
  return transaction(database, async (client) => {
    let attempt = await ownedAttempt(client, userId, attemptId);
    if (attempt.expired) attempt = await closeAttempt(client, attempt);
    const questions = await getQuestions(client, attempt.test_id);
    const answers = (
      await client.query("SELECT * FROM cutoff.answers WHERE attempt_id = $1", [
        attemptId,
      ])
    ).rows;
    const selections = (
      await client.query(
        "SELECT * FROM cutoff.answer_options WHERE attempt_id = $1 ORDER BY option_label",
        [attemptId],
      )
    ).rows;
    return {
      attempt,
      questions,
      answers: answers.map((answer) => ({
        ...answer,
        selectedOptions: selections
          .filter((option) => option.question_id === answer.question_id)
          .map((option) => option.option_label),
      })),
    };
  });
}
async function submitAttempt(database, userId, attemptId) {
  return transaction(database, async (client) =>
    closeAttempt(client, await ownedAttempt(client, userId, attemptId)),
  );
}
module.exports = {
  ownedAttempt,
  closeAttempt,
  startAttempt,
  getAttempt,
  submitAttempt,
};
