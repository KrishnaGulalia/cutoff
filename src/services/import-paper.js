const { validatePaper } = require("./paper-validation");

async function addQuestion(tx, testId, question, position) {
  const subject = await tx.subject.upsert({
    where: { subject_name: question.subject },
    update: {},
    create: { subject_name: question.subject },
  });
  const chapterKey = {
    subject_id: subject.subject_id,
    chapter_name: question.chapter.trim(),
  };
  const chapter = await tx.chapter.upsert({
    where: { subject_id_chapter_name: chapterKey },
    update: {},
    create: chapterKey,
  });
  const saved = await tx.question.create({
    data: {
      chapter_id: chapter.chapter_id,
      question_text: question.text,
      question_type: question.type,
      difficulty: question.difficulty,
      explanation_text: question.explanation,
    },
  });
  const question_id = saved.question_id;
  if (question.topic) {
    const key = {
      chapter_id: chapter.chapter_id,
      topic_name: question.topic.trim(),
    };
    const topic = await tx.topic.upsert({
      where: { chapter_id_topic_name: key },
      update: {},
      create: key,
    });
    await tx.questionTopic.create({
      data: { question_id, topic_id: topic.topic_id },
    });
  }
  for (const option of question.options) {
    const key = { question_id, option_label: option.label };
    await tx.questionOption.create({
      data: { ...key, option_text: option.text },
    });
    if (option.images.length)
      await tx.optionImage.createMany({
        data: option.images.map((image_url, i) => ({
          ...key,
          image_url,
          image_position: i + 1,
        })),
      });
  }
  if (question.correctOptions.length)
    await tx.correctOption.createMany({
      data: question.correctOptions.map((option_label) => ({
        question_id,
        option_label,
      })),
    });
  if (question.numericalKey)
    await tx.numericalKey.create({
      data: {
        question_id,
        accepted_min: question.numericalKey.min,
        accepted_max: question.numericalKey.max,
      },
    });
  if (question.images.length)
    await tx.questionImage.createMany({
      data: question.images.map((image_url, i) => ({
        question_id,
        image_url,
        image_position: i + 1,
      })),
    });
  await tx.testQuestion.create({
    data: {
      test_id: testId,
      question_id,
      position,
      marks_correct: question.marks.correct,
      marks_incorrect: question.marks.incorrect,
      marks_unattempted: question.marks.unattempted,
    },
  });
}

async function importPaper(db, paper) {
  const errors = validatePaper(paper);
  if (errors.length) throw new Error(errors.join("\n"));
  return db.$transaction(
    async (tx) => {
      // Serialize imports so simultaneous commands cannot publish duplicate papers.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(742032)`;
      const key = {
        test_title: paper.title.trim(),
        exam_year: paper.year,
        session_label: paper.session.trim(),
      };
      if (await tx.test.findFirst({ where: key }))
        throw new Error(
          "This paper is already imported. Use a new title/session for a corrected version.",
        );
      const test = await tx.test.create({
        data: {
          ...key,
          duration_minutes: paper.durationMinutes,
          source_reference: paper.sourceReference,
          is_demo: paper.isDemo,
        },
      });
      for (const [index, question] of paper.questions.entries())
        await addQuestion(tx, test.test_id, question, index + 1);
      return test.test_id.toString();
    },
    { timeout: 600000 },
  );
}
module.exports = { importPaper };
