const { AppError } = require("../lib/errors");
const questionMarks = { test_questions: { select: { marks_correct: true } } };
function summarizePaper({ test_questions, ...paper }) {
  return {
    ...paper,
    question_count: test_questions.length,
    maximum_marks: test_questions.reduce(
      (total, item) => total + Number(item.marks_correct),
      0,
    ),
  };
}
async function listPapers(db, filters = {}) {
  const year = filters.year ? Number(filters.year) : undefined;
  if (
    year !== undefined &&
    (!Number.isInteger(year) || year < 2000 || year > 9999)
  )
    throw new AppError(400, "Invalid year.");
  const search =
    typeof filters.search === "string" ? filters.search.slice(0, 100) : "";
  const papers = await db.test.findMany({
    where: {
      exam_year: year,
      test_title: { contains: search, mode: "insensitive" },
      test_questions: { some: {} },
    },
    include: questionMarks,
    orderBy: [{ exam_year: "desc" }, { test_id: "desc" }],
    take: 100,
  });
  return papers.map(summarizePaper);
}
async function getPaper(db, testId) {
  const paper = await db.test.findUnique({
    where: { test_id: BigInt(testId) },
    include: questionMarks,
  });
  if (!paper?.test_questions.length)
    throw new AppError(404, "Paper not found.");
  return summarizePaper(paper);
}
module.exports = { listPapers, getPaper };
