const test = require("node:test");
const assert = require("node:assert/strict");
const { validatePaper } = require("../src/services/paper-validation");
const { answerInput, id } = require("../src/lib/validation");
const demo = require("../data/demo-paper.json");
test("original demo passes import validation", () =>
  assert.deepEqual(validatePaper(demo), []));
test("unverified and malformed data are rejected", () => {
  for (const change of [
    (paper) => (paper.verified = false),
    (paper) => (paper.questions[0].correctOptions = ["Z"]),
    (paper) => (paper.questions[2].numericalKey.max = -1),
    (paper) => (paper.questions[0].options[0].images = ["javascript:alert(1)"]),
  ]) {
    const paper = structuredClone(demo);
    change(paper);
    assert.ok(validatePaper(paper).length);
  }
});
test("answer validation rejects wrong types and invalid IDs", () => {
  const input = {
    selectedOptions: ["A"],
    numericalResponse: null,
    markedForReview: false,
    timeSpentSeconds: 1,
  };
  assert.deepEqual(answerInput(input), input);
  for (const change of [
    { timeSpentSeconds: -1 },
    { markedForReview: "yes" },
    { numericalResponse: Infinity },
    { selectedOptions: ["DROP TABLE"] },
  ])
    assert.throws(() => answerInput({ ...input, ...change }));
  for (const value of ["0", "1;DROP", "-1", "abc", null])
    assert.throws(() => id(value));
});
