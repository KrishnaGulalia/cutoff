const { AppError } = require('../lib/errors');
async function listPapers(database, filters = {}) {
  const year = filters.year ? Number(filters.year) : null;
  if (year !== null && (!Number.isInteger(year) || year < 2000 || year > 9999)) throw new AppError(400, 'Invalid year.');
  const search = typeof filters.search === 'string' ? filters.search.slice(0, 100) : '';
  const result = await database.query(`
    SELECT paper.*, COUNT(item.question_id)::integer AS question_count,
           SUM(item.marks_correct)::float AS maximum_marks
    FROM cutoff.tests AS paper
    JOIN cutoff.test_questions AS item ON item.test_id = paper.test_id
    WHERE ($1::integer IS NULL OR paper.exam_year = $1)
      AND paper.test_title ILIKE $2
    GROUP BY paper.test_id ORDER BY paper.exam_year DESC, paper.test_id DESC
    LIMIT 100`, [year, '%' + search + '%']);
  return result.rows;
}
async function getPaper(database, testId) {
  const result = await database.query(`SELECT paper.*, COUNT(item.question_id)::integer AS question_count,
    SUM(item.marks_correct)::float AS maximum_marks
    FROM cutoff.tests AS paper JOIN cutoff.test_questions AS item ON item.test_id = paper.test_id
    WHERE paper.test_id = $1 GROUP BY paper.test_id`, [testId]);
  if (!result.rowCount) throw new AppError(404, 'Paper not found.');
  return result.rows[0];
}
module.exports = { listPapers, getPaper };
