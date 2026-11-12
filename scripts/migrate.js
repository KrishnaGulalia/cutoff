const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { databaseUrl } = require("../src/config");

function migrate(url = process.env.DIRECT_URL || process.env.DATABASE_URL) {
  if (!url) throw new Error("Set DIRECT_URL or DATABASE_URL before migrating.");
  // Keep the existing ledger so older installations can upgrade in place.
  const statements = [
    "BEGIN;",
    "SELECT pg_advisory_xact_lock(742031);",
    "CREATE TABLE IF NOT EXISTS public.cutoff_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now());",
    "REVOKE ALL ON public.cutoff_migrations FROM PUBLIC, anon, authenticated;",
  ];
  const directory = path.join(__dirname, "../supabase/migrations");
  for (const name of fs.readdirSync(directory).filter(name => /^\d+_\w+\.sql$/.test(name)).sort()) {
    const sql = fs.readFileSync(path.join(directory, name), "utf8");
    statements.push(`DO $apply$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM public.cutoff_migrations WHERE name = '${name}') THEN
        EXECUTE $migration$${sql}$migration$;
        INSERT INTO public.cutoff_migrations(name) VALUES ('${name}');
      END IF;
    END $apply$;`);
  }
  statements.push("COMMIT;");
  const result = spawnSync(process.execPath, [require.resolve("prisma/build/index.js"), "db", "execute", "--stdin", "--schema", "prisma/schema.prisma"], {
    cwd: path.join(__dirname, ".."),
    env: { ...process.env, DATABASE_URL: databaseUrl(url) },
    input: statements.join("\n"),
    encoding: "utf8",
  });
  if (result.status !== 0) {
    const code = result.stderr?.match(/\bP\d{4}\b/)?.[0];
    throw new Error("Migration failed" + (code ? " (" + code + ")" : "") + ". Check the connection, permissions and schema.");
  }
}
if (require.main === module) {
  try {
    migrate();
    console.log("Database migrations are up to date.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { migrate };
