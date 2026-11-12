const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { connectionOptions } = require("../config");

function createDatabase(url = process.env.DATABASE_URL) {
  const adapter = new PrismaPg(connectionOptions(url));
  return new PrismaClient({
    adapter,
    transactionOptions: { maxWait: 15000, timeout: 30000 },
  });
}

const prisma = createDatabase();
module.exports = { prisma, createDatabase };
