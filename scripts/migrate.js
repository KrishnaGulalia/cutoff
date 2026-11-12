const fs = require("node:fs");
const path = require("node:path");
const { createDatabase } = require("../src/lib/db");

async function migrate(
  url = process.env.DIRECT_URL || process.env.DATABASE_URL,
) {
  if (!url) throw new Error("Set DIRECT_URL or DATABASE_URL before migrating.");
  const database = createDatabase(url);
  try {
    await database.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(742031)`;
        await tx.$executeRaw`CREATE TABLE IF NOT EXISTS public.cutoff_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now())`;
        await tx.$executeRaw`REVOKE ALL ON public.cutoff_migrations FROM PUBLIC, anon, authenticated`;
        const directory = path.join(__dirname, "../supabase/migrations");
        for (const name of fs
          .readdirSync(directory)
          .filter((name) => /^\d+_\w+\.sql$/.test(name))
          .sort()) {
          const applied =
            await tx.$queryRaw`SELECT name FROM public.cutoff_migrations WHERE name = ${name}`;
          if (applied.length) continue;
          // A migration is one trusted repository file containing several SQL statements.
          const sql = fs.readFileSync(path.join(directory, name), "utf8");
          await tx.$executeRawUnsafe(
            `DO $apply$ BEGIN EXECUTE $migration$${sql}$migration$; END $apply$`,
          );
          await tx.$executeRaw`INSERT INTO public.cutoff_migrations(name) VALUES (${name})`;
        }
      },
      { timeout: 120000 },
    );
  } finally {
    await database.$disconnect();
  }
}
if (require.main === module) {
  migrate()
    .then(() => console.log("Database migrations are up to date."))
    .catch((error) => {
      console.error(
        "Migration failed. Check the connection, permissions and schema.",
        error.code || "",
      );
      process.exitCode = 1;
    });
}
module.exports = { migrate };
