const fs = require('node:fs/promises');
const path = require('node:path');
const { getPool, transaction } = require('../src/lib/db');
async function migrate(database) {
  await transaction(database, async (client) => {
    // Serialize two accidental simultaneous migration runs.
    await client.query('SELECT pg_advisory_xact_lock(742031)');
    await client.query('CREATE TABLE IF NOT EXISTS public.cutoff_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now())');
    await client.query('REVOKE ALL ON public.cutoff_migrations FROM PUBLIC, anon, authenticated');
    const directory = path.join(__dirname, '../supabase/migrations');
    for (const name of (await fs.readdir(directory)).filter(name => name.endsWith('.sql')).sort()) {
      const applied = await client.query('SELECT name FROM public.cutoff_migrations WHERE name = $1', [name]);
      if (applied.rowCount) continue;
      await client.query(await fs.readFile(path.join(directory, name), 'utf8'));
      await client.query('INSERT INTO public.cutoff_migrations(name) VALUES ($1)', [name]);
      console.log('Applied', name);
    }
  });
}
if (require.main === module) {
  const database = getPool();
  migrate(database).catch(() => { console.error('Migration failed. Check the database connection and schema; no migrations in this run were committed.'); process.exitCode = 1; }).finally(() => database.end());
}
module.exports = { migrate };
