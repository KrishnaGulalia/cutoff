const { AppError } = require("../lib/errors");
const { ownedAttempt, closeAttempt, readAnswers } = require("./attempts");
const { getQuestions } = require("./questions");
const { scoreQuestion, summarize } = require("./scoring");
function groupResults(questions, field) {
  const groups = new Map();
  for (const question of questions) {
    // Chapter/topic names are scoped by their parents, not globally unique.
    let name = question[field] || "Unclassified topic";
    if (field === "chapter_name") name = question.subject_name + " / " + name;
    if (field === "topic_name")
      name =
        question.subject_name + " / " + question.chapter_name + " / " + name;
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(question);
  }
  return [...groups].map(([name, items]) => ({
    name,
    ...summarize(items),
    slowQuestions: items.filter((item) => item.timeSpentSeconds > 180).length,
  }));
}
async function getResult(database, userId, attemptId) {
  return database.$transaction(async (client) => {
    let attempt = await ownedAttempt(client, userId, attemptId);
    if (attempt.expired) attempt = await closeAttempt(client, attempt);
    if (attempt.attempt_status !== "SUBMITTED")
      throw new AppError(409, "Submit the attempt before viewing results.");
    const questions = await getQuestions(client, attempt.test_id, true);
    const answers = await readAnswers(client, attemptId);
    const byQuestion = new Map(
      answers.map((answer) => [answer.question_id, answer]),
    );
    const scored = questions.map((question) =>
      scoreQuestion(question, byQuestion.get(question.question_id)),
    );
    return {
      attempt,
      summary: summarize(scored),
      questions: scored,
      analytics: {
        subjects: groupResults(scored, "subject_name"),
        chapters: groupResults(scored, "chapter_name"),
        topics: groupResults(scored, "topic_name"),
        difficulty: groupResults(scored, "difficulty"),
      },
    };
  });
}
module.exports = { getResult, groupResults };
