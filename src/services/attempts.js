const { AppError } = require("../lib/errors");
const { getPaper } = require("./papers");
const { getQuestions } = require("./questions");

async function ownedAttempt(tx, userId, attemptId) {
  // Saving and submitting both lock this row so they cannot change it at the same time.
  const rows = await tx.$queryRaw`
    SELECT attempt.*, paper.test_title, paper.duration_minutes,
           attempt.started_at + paper.duration_minutes * interval '1 minute' AS expires_at,
           clock_timestamp() AS server_now,
           clock_timestamp() >= attempt.started_at + paper.duration_minutes * interval '1 minute' AS expired
    FROM cutoff.attempts AS attempt
    JOIN cutoff.tests AS paper ON paper.test_id = attempt.test_id
    WHERE attempt.user_id = ${userId}::uuid
      AND attempt.attempt_id = ${BigInt(attemptId)}
    FOR UPDATE OF attempt
  `;
  if (rows.length === 0) {
    throw new AppError(404, "Attempt not found.");
  }
  return rows[0];
}

async function closeAttempt(tx, attempt) {
  if (attempt.attempt_status === "SUBMITTED") {
    return attempt;
  }
  const [updated] = await tx.$queryRaw`
    UPDATE cutoff.attempts
    SET attempt_status = 'SUBMITTED', submitted_at = clock_timestamp()
    WHERE attempt_id = ${attempt.attempt_id}
    RETURNING submitted_at
  `;
  return {
    ...attempt,
    attempt_status: "SUBMITTED",
    submitted_at: updated.submitted_at,
  };
}

async function startAttempt(db, userId, testId) {
  return db.$transaction(async (tx) => {
    await getPaper(tx, testId);
    // A double click on Start should open the same attempt both times.
    await tx.$queryRaw`SELECT user_id FROM cutoff.users WHERE user_id=${userId}::uuid FOR UPDATE`;
    const studentPaper = { user_id: userId, test_id: BigInt(testId) };
    const active = await tx.attempt.findFirst({
      where: { ...studentPaper, attempt_status: "IN_PROGRESS" },
    });
    if (active) {
      const attempt = await ownedAttempt(tx, userId, active.attempt_id);
      if (!attempt.expired) {
        return attempt;
      }
      await closeAttempt(tx, attempt);
    }
    const created = await tx.attempt.create({ data: studentPaper });
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
    if (attempt.expired) {
      attempt = await closeAttempt(tx, attempt);
    }
    const questions = await getQuestions(tx, attempt.test_id);
    const answers = await readAnswers(tx, attemptId);
    return { attempt, questions, answers };
  });
}

async function submitAttempt(db, userId, attemptId) {
  return db.$transaction(async (tx) => {
    const attempt = await ownedAttempt(tx, userId, attemptId);
    return closeAttempt(tx, attempt);
  });
}
module.exports = {
  ownedAttempt,
  closeAttempt,
  startAttempt,
  getAttempt,
  submitAttempt,
  readAnswers,
};
