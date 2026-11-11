const { validatePaper } = require("./paper-validation");
const { transaction } = require("../lib/db");
async function importPaper(database, paper) {
  const errors = validatePaper(paper);
  if (errors.length) throw new Error(errors.join("\n"));
  return transaction(database, async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(742032)");
    const existing = await client.query(
      "SELECT test_id FROM cutoff.tests WHERE test_title = $1 AND exam_year = $2 AND session_label = $3",
      [paper.title.trim(), paper.year, paper.session.trim()],
    );
    if (existing.rowCount)
      throw new Error(
        "This paper is already imported. Use a new title/session for a corrected version.",
      );
    const created = await client.query(
      `INSERT INTO cutoff.tests(test_title, exam_year, session_label, duration_minutes, source_reference, is_demo)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING test_id`,
      [
        paper.title.trim(),
        paper.year,
        paper.session.trim(),
        paper.durationMinutes,
        paper.sourceReference,
        paper.isDemo,
      ],
    );
    const testId = created.rows[0].test_id;
    for (const [index, question] of paper.questions.entries()) {
      await client.query(
        "INSERT INTO cutoff.subjects(subject_name) VALUES ($1) ON CONFLICT DO NOTHING",
        [question.subject],
      );
      const subjectId = (
        await client.query(
          "SELECT subject_id FROM cutoff.subjects WHERE subject_name = $1",
          [question.subject],
        )
      ).rows[0].subject_id;
      await client.query(
        "INSERT INTO cutoff.chapters(subject_id, chapter_name) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [subjectId, question.chapter.trim()],
      );
      const chapterId = (
        await client.query(
          "SELECT chapter_id FROM cutoff.chapters WHERE subject_id = $1 AND chapter_name = $2",
          [subjectId, question.chapter.trim()],
        )
      ).rows[0].chapter_id;
      const questionId = (
        await client.query(
          `INSERT INTO cutoff.questions(chapter_id, question_text, question_type, difficulty, explanation_text)
        VALUES ($1, $2, $3, $4, $5) RETURNING question_id`,
          [
            chapterId,
            question.text,
            question.type,
            question.difficulty,
            question.explanation,
          ],
        )
      ).rows[0].question_id;
      if (question.topic) {
        await client.query(
          "INSERT INTO cutoff.topics(chapter_id, topic_name) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [chapterId, question.topic.trim()],
        );
        const topicId = (
          await client.query(
            "SELECT topic_id FROM cutoff.topics WHERE chapter_id = $1 AND topic_name = $2",
            [chapterId, question.topic.trim()],
          )
        ).rows[0].topic_id;
        await client.query(
          "INSERT INTO cutoff.question_topics(question_id, topic_id) VALUES ($1, $2)",
          [questionId, topicId],
        );
      }
      for (const option of question.options) {
        await client.query(
          "INSERT INTO cutoff.question_options(question_id, option_label, option_text) VALUES ($1, $2, $3)",
          [questionId, option.label, option.text],
        );
        for (const [position, url] of option.images.entries())
          await client.query(
            "INSERT INTO cutoff.option_images VALUES ($1, $2, $3, $4)",
            [questionId, option.label, position + 1, url],
          );
      }
      for (const label of question.correctOptions)
        await client.query(
          "INSERT INTO cutoff.correct_options VALUES ($1, $2)",
          [questionId, label],
        );
      if (question.numericalKey)
        await client.query(
          "INSERT INTO cutoff.numerical_keys VALUES ($1, $2, $3)",
          [questionId, question.numericalKey.min, question.numericalKey.max],
        );
      for (const [position, url] of question.images.entries())
        await client.query(
          "INSERT INTO cutoff.question_images VALUES ($1, $2, $3)",
          [questionId, position + 1, url],
        );
      await client.query(
        `INSERT INTO cutoff.test_questions(test_id, question_id, position, marks_correct, marks_incorrect, marks_unattempted)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          testId,
          questionId,
          index + 1,
          question.marks.correct,
          question.marks.incorrect,
          question.marks.unattempted,
        ],
      );
    }
    return testId;
  });
}
module.exports = { importPaper };
