class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.status)
    return res.status(error.status).json({ error: error.message });
  if (
    [
      "P2000",
      "P2002",
      "P2003",
      "P2004",
      "P2020",
      "23503",
      "23505",
      "23514",
      "22P02",
      "22003",
    ].includes(error.code)
  ) {
    return res
      .status(400)
      .json({ error: "The supplied data is not valid for this operation." });
  }
  console.error("Request failed:", error.code || error.name);
  res.status(500).json({ error: "Something went wrong. Please try again." });
}
module.exports = { AppError, errorHandler };
