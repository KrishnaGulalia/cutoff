const { AppError } = require("../lib/errors");
const { getPaper } = require("./papers");
const { getQuestions } = require("./questions");
async function ownedAttempt(tx, userId, attemptId) {
  // Lock first so a submit waits for an answer save. Use the database clock for the deadline.
  const rows = await tx.$queryRaw`SELECT a.*, p.test_title, p.duration_minutes,
    a.started_at + p.duration_minutes * interval '1 minute' AS expires_at,
    clock_timestamp() AS server_now,
    clock_timestamp() >= a.started_at + p.duration_minutes * interval '1 minute' AS expired
    FROM cutoff.attempts a JOIN cutoff.tests p ON p.test_id = a.test_id
    WHERE a.user_id = ${userId}::uuid AND a.attempt_id = ${BigInt(attemptId)} FOR UPDATE OF a`;
  if (!rows.length) throw new AppError(404, "Attempt not found.");
  return rows[0];
}
async function closeAttempt(tx, attempt) {
  if (attempt.attempt_status === "SUBMITTED") return attempt;
  const [updated] =
    await tx.$queryRaw`UPDATE cutoff.attempts SET attempt_status='SUBMITTED',
    submitted_at=clock_timestamp() WHERE attempt_id=${attempt.attempt_id} RETURNING submitted_at`;
  return {
    ...attempt,
    attempt_status: "SUBMITTED",
    submitted_at: updated.submitted_at,
  };
}
async function startAttempt(db, userId, testId) {
  return db.$transaction(async (tx) => {
    await getPaper(tx, testId);
    await tx.$queryRaw`SELECT user_id FROM cutoff.users WHERE user_id=${userId}::uuid FOR UPDATE`;
    const where = { user_id: userId, test_id: BigInt(testId) };
    const active = await tx.attempt.findFirst({
      where: { ...where, attempt_status: "IN_PROGRESS" },
    });
    if (active) {
      const attempt = await ownedAttempt(tx, userId, active.attempt_id);
      if (!attempt.expired) return attempt;
      await closeAttempt(tx, attempt);
    }
    const created = await tx.attempt.create({ data: where });
    return ownedAttempt(tx, userId, created.attempt_id);
  });
}
async function readAnswers(tx, attemptId) {
  const rows = await tx.answer.findMany({
    where: { attempt_id: BigInt(attemptId) },
    include: { answer_options: { orderBy: { option_label: "asc" } } },
  });
  return rows.map(({ answer_options, ...answer }) => ({
    ...answer,
    selectedOptions: answer_options.map((option) => option.option_label),
  }));
}
async function getAttempt(db, userId, attemptId) {
  return db.$transaction(async (tx) => {
    let attempt = await ownedAttempt(tx, userId, attemptId);
    if (attempt.expired) attempt = await closeAttempt(tx, attempt);
    return {
      attempt,
      questions: await getQuestions(tx, attempt.test_id),
      answers: await readAnswers(tx, attemptId),
    };
  });
}
async function submitAttempt(db, userId, attemptId) {
  return db.$transaction(async (tx) =>
    closeAttempt(tx, await ownedAttempt(tx, userId, attemptId)),
  );
}
module.exports = {
  ownedAttempt,
  closeAttempt,
  startAttempt,
  getAttempt,
  submitAttempt,
  readAnswers,
};
