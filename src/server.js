require("./config");
const { createApp } = require("./app");
const { prisma } = require("./lib/db");
const port = Number(process.env.PORT || 3000);
const server = createApp().listen(port, () =>
  console.log(`Cutoff API: http://localhost:${port}`),
);
async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
