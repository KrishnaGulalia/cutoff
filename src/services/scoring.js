function gradeNumber(response, key) {
  if (!key) {
    throw new Error("Missing numerical key.");
  }
  // Zero is a valid answer. Only a missing value counts as a skip.
  if (response === null || response === undefined) {
    return "unattempted";
  }
  const number = Number(response);
  if (
    number >= Number(key.accepted_min) &&
    number <= Number(key.accepted_max)
  ) {
    return "correct";
  }
  return "incorrect";
}

function gradeOptions(selected, correctOptions) {
  if (correctOptions.length === 0) {
    throw new Error("Missing option key.");
  }
  if (selected.length === 0) {
    return "unattempted";
  }
  // Both lists are sorted, so A,C and C,A represent the same selection.
  if (selected.join(",") === correctOptions.join(",")) {
    return "correct";
  }
  return "incorrect";
}

function scoreQuestion(question, answer = {}) {
  const selected = [...(answer.selectedOptions || [])].sort();
  let outcome;
  if (question.question_type === "NUMERICAL") {
    outcome = gradeNumber(answer.numerical_response, question.numericalKey);
  } else {
    const correctOptions = [...(question.correctOptions || [])].sort();
    outcome = gradeOptions(selected, correctOptions);
  }
  const marks = {
    correct: question.marks_correct,
    incorrect: question.marks_incorrect,
    unattempted: question.marks_unattempted,
  };
  return {
    ...question,
    selectedOptions: selected,
    numericalResponse: answer.numerical_response ?? null,
    timeSpentSeconds: answer.time_spent_seconds || 0,
    markedForReview: answer.marked_for_review || false,
    outcome,
    marksAwarded: Number(marks[outcome]),
  };
}

function summarize(questions) {
  let score = 0;
  let maximumMarks = 0;
  let correct = 0;
  let incorrect = 0;
  let skipped = 0;
  let timeSeconds = 0;

  for (const question of questions) {
    score += question.marksAwarded;
    maximumMarks += Number(question.marks_correct);
    timeSeconds += question.timeSpentSeconds;
    if (question.outcome === "correct") {
      correct++;
    } else if (question.outcome === "incorrect") {
      incorrect++;
    } else {
      skipped++;
    }
  }
  const attempted = correct + incorrect;
  let accuracy = null;
  if (attempted > 0) {
    accuracy = Math.round((correct / attempted) * 10000) / 100;
  }
  return {
    score: Math.round(score * 100) / 100,
    maximumMarks,
    correct,
    incorrect,
    skipped,
    questionCount: questions.length,
    timeSeconds,
    accuracy,
  };
}
module.exports = { scoreQuestion, summarize };
