const { PrismaClient } = require("@prisma/client");
const { databaseUrl } = require("../config");

function createDatabase(url = process.env.DATABASE_URL) {
  return new PrismaClient({
    ...(url && { datasourceUrl: databaseUrl(url) }),
    transactionOptions: { maxWait: 15000, timeout: 30000 },
  });
}

const prisma = createDatabase();
module.exports = { prisma, createDatabase };
