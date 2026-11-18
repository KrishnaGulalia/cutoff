const { AppError } = require("./errors");
function id(value) {
  if (typeof value !== "string" || !/^[1-9][0-9]{0,17}$/.test(value))
    throw new AppError(400, "Invalid ID.");
  return value;
}
function answerInput(body) {
  if (
    !body ||
    !Array.isArray(body.selectedOptions) ||
    body.selectedOptions.length > 26 ||
    body.selectedOptions.some(
      (label) => typeof label !== "string" || !/^[A-Z]$/.test(label),
    )
  ) {
    throw new AppError(400, "Choose valid option labels.");
  }
  if (
    typeof body.markedForReview !== "boolean" ||
    !Number.isInteger(body.timeSpentSeconds) ||
    body.timeSpentSeconds < 0 ||
    body.timeSpentSeconds > 86400
  )
    throw new AppError(400, "Invalid review flag or time.");
  const number = body.numericalResponse;
  if (
    number !== null &&
    (typeof number !== "number" || !Number.isFinite(number))
  )
    throw new AppError(400, "Enter a finite numerical answer.");
  return { ...body, selectedOptions: [...new Set(body.selectedOptions)] };
}
module.exports = { id, answerInput };
