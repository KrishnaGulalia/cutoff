const { Pool } = require('pg');
const { createApp } = require('../../src/app');
const { migrate } = require('../../scripts/migrate');
const { importPaper } = require('../../src/services/import-paper');
const { AppError } = require('../../src/lib/errors');
const { user, token } = require('./fixture');
const url=process.env.TEST_DATABASE_URL;
if (!url || !['localhost','127.0.0.1'].includes(new URL(url).hostname) || !new URL(url).pathname.startsWith('/cutoff_test')) throw new Error('Browser tests require a dedicated local test DB.');
async function main() {
  const database=new Pool({connectionString:url});
  await database.query('CREATE SCHEMA IF NOT EXISTS auth; CREATE TABLE IF NOT EXISTS auth.users(id UUID PRIMARY KEY)');
  for(const role of ['anon','authenticated']) await database.query(`DO $$ BEGIN CREATE ROLE ${role}; EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  await migrate(database);
  await database.query('INSERT INTO auth.users(id) VALUES ($1) ON CONFLICT DO NOTHING',[user.id]);
  const demo=require('../../data/demo-paper.json');
  if (!(await database.query('SELECT test_id FROM cutoff.tests WHERE test_title=$1',[demo.title])).rowCount) await importPaper(database,demo);
  const app=createApp({database,verifyToken:async value=>{if(value!==token)throw new AppError(401,'Invalid test token');return user;}});
  app.listen(3001,'127.0.0.1',()=>console.log('Isolated browser-test API ready.'));
}
main().catch(error=>{console.error(error);process.exit(1);});
