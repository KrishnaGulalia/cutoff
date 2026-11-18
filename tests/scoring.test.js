const test = require("node:test");
const assert = require("node:assert/strict");
const { scoreQuestion, summarize } = require("../src/services/scoring");
const { groupResults } = require("../src/services/results");
const question = {
  question_type: "MULTIPLE_SELECT",
  correctOptions: ["A", "C"],
  marks_correct: 4,
  marks_incorrect: -1,
  marks_unattempted: 0,
};
test("multiple-select requires exactly the complete set", () => {
  assert.equal(
    scoreQuestion(question, { selectedOptions: ["C", "A"] }).outcome,
    "correct",
  );
  assert.equal(
    scoreQuestion(question, { selectedOptions: ["A"] }).marksAwarded,
    -1,
  );
  assert.equal(
    scoreQuestion(question, { selectedOptions: ["A", "B", "C"] }).outcome,
    "incorrect",
  );
});
test("empty response remains unattempted", () =>
  assert.equal(scoreQuestion(question).outcome, "unattempted"));
test("zero and inclusive decimal bounds are valid numerical answers", () => {
  const numeric = {
    ...question,
    question_type: "NUMERICAL",
    numericalKey: { accepted_min: 0, accepted_max: 0.5 },
  };
  for (const value of [0, 0.5])
    assert.equal(
      scoreQuestion(numeric, { numerical_response: value }).outcome,
      "correct",
    );
  assert.equal(
    scoreQuestion(numeric, { numerical_response: -0.01 }).outcome,
    "incorrect",
  );
  assert.equal(
    scoreQuestion(numeric, { numerical_response: null }).outcome,
    "unattempted",
  );
});
test("summary handles negative marks and undefined accuracy", () => {
  const scored = [
    scoreQuestion(question, { selectedOptions: ["A", "C"] }),
    scoreQuestion(question, { selectedOptions: ["A"] }),
    scoreQuestion(question),
  ];
  assert.deepEqual(summarize(scored), {
    score: 3,
    maximumMarks: 12,
    correct: 1,
    incorrect: 1,
    skipped: 1,
    questionCount: 3,
    timeSeconds: 0,
    accuracy: 50,
  });
  assert.equal(summarize([scoreQuestion(question)]).accuracy, null);
});
test("same chapter names in different subjects stay separate", () => {
  const scored = scoreQuestion(question);
  const groups = groupResults(
    [
      { ...scored, subject_name: "Physics", chapter_name: "Basics" },
      { ...scored, subject_name: "Chemistry", chapter_name: "Basics" },
    ],
    "chapter_name",
  );
  assert.equal(groups.length, 2);
});
