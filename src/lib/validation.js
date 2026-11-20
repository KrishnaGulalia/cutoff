const { AppError } = require("./errors");
function id(value) {
  if (typeof value !== "string" || !/^[1-9][0-9]{0,17}$/.test(value))
    throw new AppError(400, "Invalid ID.");
  return value;
}
function answerInput(body) {
  const labels = body?.selectedOptions;
  if (!Array.isArray(labels) || labels.length > 26) {
    throw new AppError(400, "Choose valid option labels.");
  }
  for (const label of labels) {
    if (typeof label !== "string" || !/^[A-Z1-4]$/.test(label)) {
      throw new AppError(400, "Choose valid option labels.");
    }
  }
  if (
    typeof body.markedForReview !== "boolean" ||
    !Number.isInteger(body.timeSpentSeconds) ||
    body.timeSpentSeconds < 0 ||
    body.timeSpentSeconds > 86400
  )
    throw new AppError(400, "Invalid review flag or time.");
  const number = body.numericalResponse;
  if (number !== null && !Number.isFinite(number))
    throw new AppError(400, "Enter a finite numerical answer.");
  return { ...body, selectedOptions: [...new Set(labels)] };
}
module.exports = { id, answerInput };
