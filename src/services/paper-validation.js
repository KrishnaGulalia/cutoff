function validatePaper(paper) {
  const errors = [];
  const text = (value) => typeof value === "string" && value.trim().length > 0;
  const imagesValid = (images) =>
    Array.isArray(images) &&
    images.length <= 10 &&
    images.every((url) => {
      try {
        return new URL(url).protocol === "https:";
      } catch {
        return false;
      }
    });
  if (!paper || typeof paper !== "object") return ["Paper must be an object."];
  if (
    !text(paper.title) ||
    !text(paper.session) ||
    !text(paper.sourceReference)
  )
    errors.push("Title, session and sourceReference are required.");
  if (!Number.isInteger(paper.year) || paper.year < 2000 || paper.year > 9999)
    errors.push("Year must be a valid integer.");
  if (
    !Number.isInteger(paper.durationMinutes) ||
    paper.durationMinutes < 1 ||
    paper.durationMinutes > 300
  )
    errors.push("Duration must be 1–300 minutes.");
  if (paper.verified !== true || typeof paper.isDemo !== "boolean")
    errors.push("Set verified to true and specify isDemo.");
  if (
    !Array.isArray(paper.questions) ||
    paper.questions.length < 1 ||
    paper.questions.length > 200
  )
    return [...errors, "Provide 1–200 questions."];
  paper.questions.forEach((question, index) => {
    const fail = (message) => errors.push(`Question ${index + 1}: ${message}`);
    if (!question || typeof question !== "object")
      return fail("must be an object.");
    if (!["Physics", "Chemistry", "Mathematics"].includes(question.subject))
      fail("use Physics, Chemistry or Mathematics.");
    if (!text(question.chapter) || !text(question.text))
      fail("chapter and text are required.");
    if (question.topic !== null && !text(question.topic))
      fail("topic must be text or null.");
    if (!["easy", "medium", "hard"].includes(question.difficulty))
      fail("invalid difficulty.");
    if (typeof question.explanation !== "string")
      fail("explanation must be text.");
    if (!imagesValid(question.images))
      fail("images must be a list of HTTPS URLs.");
    const marks = question.marks;
    if (
      !marks ||
      !Number.isFinite(marks.correct) ||
      marks.correct <= 0 ||
      marks.correct > 100 ||
      !Number.isFinite(marks.incorrect) ||
      marks.incorrect > 0 ||
      marks.incorrect < -100 ||
      marks.unattempted !== 0
    )
      fail("invalid marking rules.");
    const options = question.options;
    const keys = question.correctOptions;
    if (!Array.isArray(options) || !Array.isArray(keys))
      return fail("options and correctOptions must be lists.");
    if (question.type === "NUMERICAL") {
      const key = question.numericalKey;
      if (
        options.length ||
        keys.length ||
        !key ||
        !Number.isFinite(key.min) ||
        !Number.isFinite(key.max) ||
        key.min > key.max
      )
        fail("invalid numerical key.");
    } else if (["SINGLE_CHOICE", "MULTIPLE_SELECT"].includes(question.type)) {
      if (
        question.numericalKey !== null ||
        options.length < 2 ||
        options.length > 26
      )
        fail("provide 2–26 options and no numerical key.");
      const labels = options.map((option) => option?.label);
      if (new Set(labels).size !== labels.length)
        fail("option labels must be unique.");
      for (const option of options) {
        if (
          !option ||
          !/^[A-Z]$/.test(option.label) ||
          typeof option.text !== "string" ||
          !imagesValid(option.images) ||
          (!text(option.text) && !option.images?.length)
        )
          fail("invalid option.");
      }
      if (
        !keys.length ||
        new Set(keys).size !== keys.length ||
        keys.some((key) => !labels.includes(key))
      )
        fail("invalid correct options.");
      if (question.type === "SINGLE_CHOICE" && keys.length !== 1)
        fail("single choice needs exactly one correct option.");
    } else fail("invalid question type.");
  });
  return errors;
}
module.exports = { validatePaper };
