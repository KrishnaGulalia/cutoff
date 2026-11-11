async function getQuestions(database, testId, includeKeys = false) {
  const result = await database.query(
    `SELECT question.question_id, question.question_text,
    question.question_type, question.difficulty, chapter.chapter_name, subject.subject_name,
    topic.topic_name, item.position, item.marks_correct, item.marks_incorrect, item.marks_unattempted
    ${includeKeys ? ", question.explanation_text" : ""}
    FROM cutoff.test_questions AS item
    JOIN cutoff.questions AS question ON question.question_id = item.question_id
    JOIN cutoff.chapters AS chapter ON chapter.chapter_id = question.chapter_id
    JOIN cutoff.subjects AS subject ON subject.subject_id = chapter.subject_id
    LEFT JOIN cutoff.question_topics AS assignment ON assignment.question_id = question.question_id
    LEFT JOIN cutoff.topics AS topic ON topic.topic_id = assignment.topic_id
    WHERE item.test_id = $1 ORDER BY item.position`,
    [testId],
  );
  const ids = result.rows.map((question) => question.question_id);
  if (!ids.length) return [];
  const options = await database.query(
    "SELECT * FROM cutoff.question_options WHERE question_id = ANY($1::bigint[]) ORDER BY option_label",
    [ids],
  );
  const images = await database.query(
    "SELECT * FROM cutoff.question_images WHERE question_id = ANY($1::bigint[]) ORDER BY image_position",
    [ids],
  );
  const optionImages = await database.query(
    "SELECT * FROM cutoff.option_images WHERE question_id = ANY($1::bigint[]) ORDER BY image_position",
    [ids],
  );
  let correct = [],
    numbers = [];
  if (includeKeys) {
    correct = (
      await database.query(
        "SELECT * FROM cutoff.correct_options WHERE question_id = ANY($1::bigint[]) ORDER BY option_label",
        [ids],
      )
    ).rows;
    numbers = (
      await database.query(
        "SELECT * FROM cutoff.numerical_keys WHERE question_id = ANY($1::bigint[])",
        [ids],
      )
    ).rows;
  }
  return result.rows.map((question) => {
    const questionId = question.question_id;
    const item = {
      ...question,
      options: options.rows
        .filter((option) => option.question_id === questionId)
        .map((option) => ({
          label: option.option_label,
          text: option.option_text,
          images: optionImages.rows
            .filter(
              (image) =>
                image.question_id === questionId &&
                image.option_label === option.option_label,
            )
            .map((image) => image.image_url),
        })),
      images: images.rows
        .filter((image) => image.question_id === questionId)
        .map((image) => image.image_url),
    };
    if (includeKeys) {
      item.correctOptions = correct
        .filter((option) => option.question_id === questionId)
        .map((option) => option.option_label);
      item.numericalKey =
        numbers.find((key) => key.question_id === questionId) || null;
    }
    return item;
  });
}
module.exports = { getQuestions };
