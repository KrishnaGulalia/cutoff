const fs = require("node:fs");
const path = require("node:path");
const { prisma } = require("../src/lib/db");
const { importPaper } = require("../src/services/import-paper");

async function main() {
  const input = process.argv[2];
  if (!input) throw new Error("Pass a paper JSON file or a folder of papers.");

  const folder = fs.statSync(input).isDirectory();
  const files = folder
    ? fs
        .readdirSync(input)
        .filter((name) => name.endsWith(".json"))
        .sort()
        .map((name) => path.join(input, name))
    : [input];
  if (files.length === 0)
    throw new Error("This folder contains no paper JSON files.");

  for (const file of files) {
    const paper = JSON.parse(fs.readFileSync(file, "utf8"));
    const id = await importPaper(prisma, paper, { skipExisting: folder });
    console.log(id ? "Imported:" : "Already present:", paper.title);
  }
}

main()
  .catch((error) => {
    console.error(
      error.code
        ? "Paper import failed. Check the database connection and migrations."
        : error.message,
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
