require('../src/config');
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
let missing = false;
for (const name of ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY']) {
  const ready = Boolean(process.env[name]); console.log(name + ': ' + (ready ? 'set' : 'missing')); missing ||= !ready;
}
const file = path.join(__dirname, '../client/.env.local');
const client = fs.existsSync(file) ? dotenv.parse(fs.readFileSync(file)) : {};
for (const name of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY']) {
  const ready = Boolean(client[name]); console.log(name + ': ' + (ready ? 'set' : 'missing')); missing ||= !ready;
}
process.exitCode = missing ? 1 : 0;
