require("dotenv").config({ quiet: true });
const fs = require("node:fs");

function connectionOptions(value) {
  if (!value) return {};
  const url = new URL(value);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const ssl = local ? false : { rejectUnauthorized: true };
  if (!local && process.env.DATABASE_CA_FILE)
    ssl.ca = fs.readFileSync(process.env.DATABASE_CA_FILE, "utf8");
  // The adapter receives the TLS settings above, including the project's CA.
  for (const key of [
    "sslmode",
    "sslcert",
    "sslkey",
    "sslrootcert",
    "ssl",
    "pgbouncer",
  ])
    url.searchParams.delete(key);
  return {
    connectionString: url.toString(),
    ssl,
    max: 10,
    connectionTimeoutMillis: 8000,
  };
}
module.exports = { connectionOptions };
