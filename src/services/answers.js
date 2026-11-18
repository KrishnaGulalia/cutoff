const { transaction } = require('../lib/db');
const { AppError } = require('../lib/errors');
const { ownedAttempt, closeAttempt } = require('./attempts');
async function saveAnswer(database, userId, attemptId, questionId, answer) {
  const saved = await transaction(database, async client => {
    const attempt = await ownedAttempt(client, userId, attemptId);
    if (attempt.attempt_status === 'SUBMITTED') return { closed: true };
    if (attempt.expired) { await closeAttempt(client, attempt); return { closed: true }; }
    const question = (await client.query(`SELECT question.question_type FROM cutoff.questions AS question
      JOIN cutoff.test_questions AS item ON item.question_id = question.question_id
      WHERE item.test_id = $1 AND question.question_id = $2`, [attempt.test_id, questionId])).rows[0];
    if (!question) throw new AppError(400, 'This question is not in the paper.');
    if (question.question_type === 'NUMERICAL' && answer.selectedOptions.length) throw new AppError(400, 'Numerical questions do not accept options.');
    if (question.question_type !== 'NUMERICAL' && answer.numericalResponse !== null) throw new AppError(400, 'Choose an option for this question.');
    if (question.question_type === 'SINGLE_CHOICE' && answer.selectedOptions.length > 1) throw new AppError(400, 'Choose one option.');
    const result = await client.query(`INSERT INTO cutoff.answers AS existing
      (attempt_id, question_id, numerical_response, marked_for_review, time_spent_seconds)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (attempt_id, question_id) DO UPDATE SET
      numerical_response = EXCLUDED.numerical_response, marked_for_review = EXCLUDED.marked_for_review,
      time_spent_seconds = GREATEST(existing.time_spent_seconds, EXCLUDED.time_spent_seconds)
      RETURNING *`, [attemptId, questionId, answer.numericalResponse, answer.markedForReview, answer.timeSpentSeconds]);
    await client.query('DELETE FROM cutoff.answer_options WHERE attempt_id = $1 AND question_id = $2', [attemptId, questionId]);
    for (const label of answer.selectedOptions) {
      await client.query('INSERT INTO cutoff.answer_options(attempt_id, question_id, option_label) VALUES ($1, $2, $3)', [attemptId, questionId, label]);
    }
    return { ...result.rows[0], selectedOptions: answer.selectedOptions };
  });
  if (saved.closed) throw new AppError(409, 'This attempt has ended. Open your results.');
  return saved;
}
module.exports = { saveAnswer };
