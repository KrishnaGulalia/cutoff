const fs = require("node:fs");
const { prisma } = require("../src/lib/db");
const { importPaper } = require("../src/services/import-paper");
async function main() {
  if (!process.argv[2])
    throw new Error("Usage: npm run data:import -- path/to/paper.json");
  const paper = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  try {
    console.log("Imported paper ID:", await importPaper(prisma, paper));
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((error) => {
  console.error(
    error.code
      ? "Import failed; no paper changes were committed. Check your connection and input."
      : error.message,
  );
  process.exitCode = 1;
});
