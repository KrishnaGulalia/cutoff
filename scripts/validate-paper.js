const fs = require("node:fs");
const { validatePaper } = require("../src/services/paper-validation");
try {
  if (!process.argv[2])
    throw new Error("Usage: npm run data:validate -- path/to/paper.json");
  const errors = validatePaper(
    JSON.parse(fs.readFileSync(process.argv[2], "utf8")),
  );
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(
    "Paper structure is valid. Verify it against the original source before import.",
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
