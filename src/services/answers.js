const { AppError } = require("../lib/errors");
const { ownedAttempt, closeAttempt } = require("./attempts");
async function saveAnswer(db, userId, attemptId, questionId, answer) {
  const saved = await db.$transaction(async (tx) => {
    const attempt = await ownedAttempt(tx, userId, attemptId);
    if (attempt.attempt_status === "SUBMITTED") return null;
    if (attempt.expired) {
      await closeAttempt(tx, attempt);
      return null;
    }
    const question_id = BigInt(questionId);
    const item = await tx.testQuestion.findUnique({
      where: { test_id_question_id: { test_id: attempt.test_id, question_id } },
      include: { questions: { select: { question_type: true } } },
    });
    if (!item) throw new AppError(400, "This question is not in the paper.");
    const type = item.questions.question_type;
    if (type === "NUMERICAL" && answer.selectedOptions.length)
      throw new AppError(400, "Numerical questions do not accept options.");
    if (type !== "NUMERICAL" && answer.numericalResponse !== null)
      throw new AppError(400, "Choose an option for this question.");
    if (type === "SINGLE_CHOICE" && answer.selectedOptions.length > 1)
      throw new AppError(400, "Choose one option.");
    const key = { attempt_id: attempt.attempt_id, question_id };
    const where = { attempt_id_question_id: key };
    const previous = await tx.answer.findUnique({ where });
    const values = {
      numerical_response: answer.numericalResponse,
      marked_for_review: answer.markedForReview,
      time_spent_seconds: Math.max(
        previous?.time_spent_seconds ?? 0,
        answer.timeSpentSeconds,
      ),
    };
    const row = await tx.answer.upsert({
      where,
      create: { ...key, ...values },
      update: values,
    });
    await tx.answerOption.deleteMany({ where: key });
    if (answer.selectedOptions.length)
      await tx.answerOption.createMany({
        data: answer.selectedOptions.map((option_label) => ({
          ...key,
          option_label,
        })),
      });
    return { ...row, selectedOptions: answer.selectedOptions };
  });
  if (!saved)
    throw new AppError(409, "This attempt has ended. Open your results.");
  return saved;
}
module.exports = { saveAnswer };
