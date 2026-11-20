async function getQuestions(db, testId, includeKeys = false) {
  // A running exam gets the question and its options. Results also get the solutions.
  const questionFields = {
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
  };
  const paperQuestions = await db.testQuestion.findMany({
    where: { test_id: BigInt(testId) },
    orderBy: { position: "asc" },
    include: { questions: { select: questionFields } },
  });

  const questions = [];
  for (const entry of paperQuestions) {
    const question = entry.questions;
    const options = [];
    const correctOptions = [];
    for (const option of question.question_options) {
      options.push({
        label: option.option_label,
        text: option.option_text,
        images: option.option_images.map((image) => image.image_url),
      });
      if (includeKeys && option.correct_options) {
        correctOptions.push(option.option_label);
      }
    }

    const item = {
      question_id: question.question_id,
      question_text: question.question_text,
      question_type: question.question_type,
      difficulty: question.difficulty,
      chapter_name: question.chapters.chapter_name,
      subject_name: question.chapters.subjects.subject_name,
      topic_name: question.question_topics?.topics.topic_name ?? null,
      position: entry.position,
      marks_correct: entry.marks_correct,
      marks_incorrect: entry.marks_incorrect,
      marks_unattempted: entry.marks_unattempted,
      options,
      images: question.question_images.map((image) => image.image_url),
    };
    if (includeKeys) {
      item.correctOptions = correctOptions;
      item.numericalKey = question.numerical_keys;
      item.explanation_text = question.explanation_text;
    }
    questions.push(item);
  }
  return questions;
}

module.exports = { getQuestions };
