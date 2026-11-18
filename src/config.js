require("dotenv").config({ quiet: true });
const fs = require("node:fs");
function databaseOptions(url = process.env.DATABASE_URL) {
  if (!url) throw new Error("Add DATABASE_URL to .env first.");
  const connection = new URL(url);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(
    connection.hostname,
  );
  // Keep certificate verification on. A downloaded Supabase CA is optional.
  const ssl = local ? false : { rejectUnauthorized: true };
  if (!local && process.env.DATABASE_CA_FILE) {
    ssl.ca = fs.readFileSync(process.env.DATABASE_CA_FILE, "utf8");
  }
  for (const name of ["sslmode", "sslcert", "sslkey", "sslrootcert"])
    connection.searchParams.delete(name);
  return {
    connectionString: connection.toString(),
    ssl,
    max: 10,
    connectionTimeoutMillis: 8000,
  };
}
module.exports = { databaseOptions };
