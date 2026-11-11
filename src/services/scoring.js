function scoreQuestion(question, answer = {}) {
  const selected = [...(answer.selectedOptions || [])].sort();
  const key = [...(question.correctOptions || [])].sort();
  let outcome;
  if (question.question_type === 'NUMERICAL') {
    if (!question.numericalKey) throw new Error('Missing numerical key.');
    if (answer.numerical_response === null || answer.numerical_response === undefined) outcome = 'unattempted';
    else {
      const number = Number(answer.numerical_response);
      outcome = number >= Number(question.numericalKey.accepted_min) && number <= Number(question.numericalKey.accepted_max) ? 'correct' : 'incorrect';
    }
  } else {
    if (!key.length) throw new Error('Missing option key.');
    if (!selected.length) outcome = 'unattempted';
    else outcome = selected.join(',') === key.join(',') ? 'correct' : 'incorrect';
  }
  const marks = { correct: question.marks_correct, incorrect: question.marks_incorrect, unattempted: question.marks_unattempted };
  return { ...question, selectedOptions: selected, numericalResponse: answer.numerical_response ?? null,
    timeSpentSeconds: answer.time_spent_seconds || 0, markedForReview: answer.marked_for_review || false,
    outcome, marksAwarded: Number(marks[outcome]) };
}
function summarize(questions) {
  let score = 0, maximumMarks = 0, correct = 0, incorrect = 0, skipped = 0, timeSeconds = 0;
  for (const question of questions) {
    score += question.marksAwarded;
    maximumMarks += Number(question.marks_correct);
    timeSeconds += question.timeSpentSeconds;
    if (question.outcome === 'correct') correct++;
    else if (question.outcome === 'incorrect') incorrect++;
    else skipped++;
  }
  const attempted = correct + incorrect;
  return { score: Math.round(score * 100) / 100, maximumMarks, correct, incorrect, skipped,
    questionCount: questions.length, timeSeconds, accuracy: attempted ? Math.round(correct / attempted * 10000) / 100 : null };
}
module.exports = { scoreQuestion, summarize };
