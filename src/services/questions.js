async function getQuestions(db, testId, includeKeys = false) {
  const rows = await db.testQuestion.findMany({
    where: { test_id: BigInt(testId) },
    orderBy: { position: "asc" },
    include: {
      questions: {
        select: {
          question_id: true,
          question_text: true,
          question_type: true,
          difficulty: true,
          chapters: { include: { subjects: true } },
          question_topics: { include: { topics: true } },
          question_images: { orderBy: { image_position: "asc" } },
          question_options: {
            orderBy: { option_label: "asc" },
            include: {
              option_images: { orderBy: { image_position: "asc" } },
              correct_options: includeKeys,
            },
          },
          explanation_text: includeKeys,
          numerical_keys: includeKeys,
        },
      },
    },
  });
  return rows.map(
    ({
      questions: q,
      position,
      marks_correct,
      marks_incorrect,
      marks_unattempted,
    }) => {
      const question = {
        question_id: q.question_id,
        question_text: q.question_text,
        question_type: q.question_type,
        difficulty: q.difficulty,
        chapter_name: q.chapters.chapter_name,
        subject_name: q.chapters.subjects.subject_name,
        topic_name: q.question_topics?.topics.topic_name ?? null,
        position,
        marks_correct,
        marks_incorrect,
        marks_unattempted,
        options: q.question_options.map((option) => ({
          label: option.option_label,
          text: option.option_text,
          images: option.option_images.map((image) => image.image_url),
        })),
        images: q.question_images.map((image) => image.image_url),
      };
      if (includeKeys) {
        question.correctOptions = q.question_options
          .filter((option) => option.correct_options)
          .map((option) => option.option_label);
        question.numericalKey = q.numerical_keys;
        question.explanation_text = q.explanation_text;
      }
      return question;
    },
  );
}
module.exports = { getQuestions };
