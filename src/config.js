require("dotenv").config({ quiet: true });
const path = require("node:path");

function databaseUrl(value) {
  const url = new URL(value);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    url.searchParams.set("sslmode", "require");
    url.searchParams.set("sslaccept", "strict");
    if (process.env.DATABASE_CA_FILE)
      url.searchParams.set("sslcert", path.resolve(process.env.DATABASE_CA_FILE));
  }
  return url.toString();
}
module.exports = { databaseUrl };
