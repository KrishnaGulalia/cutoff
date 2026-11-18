require("./config");
const { createApp } = require("./app");
const { getPool } = require("./lib/db");
const port = Number(process.env.PORT || 3000);
const server = createApp().listen(port, () =>
  console.log(`Cutoff API: http://localhost:${port}`),
);
async function shutdown() {
  server.close(async () => {
    if (process.env.DATABASE_URL) await getPool().end();
    process.exit(0);
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
