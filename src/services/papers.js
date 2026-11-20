const { AppError } = require("../lib/errors");
const questionMarks = { test_questions: { select: { marks_correct: true } } };

function summarizePaper({ test_questions, ...paper }) {
  let maximumMarks = 0;
  for (const question of test_questions) {
    maximumMarks += Number(question.marks_correct);
  }
  return {
    ...paper,
    question_count: test_questions.length,
    maximum_marks: maximumMarks,
  };
}

async function listPapers(db, filters = {}) {
  let year;
  if (filters.year) {
    year = Number(filters.year);
    if (!Number.isInteger(year) || year < 2000 || year > 9999) {
      throw new AppError(400, "Invalid year.");
    }
  }
  let search = "";
  if (typeof filters.search === "string") {
    search = filters.search.slice(0, 100);
  }
  const papers = await db.test.findMany({
    where: {
      is_demo: false,
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
  if (!paper || paper.is_demo || paper.test_questions.length === 0) {
    throw new AppError(404, "Paper not found.");
  }
  return summarizePaper(paper);
}
module.exports = { listPapers, getPaper };
