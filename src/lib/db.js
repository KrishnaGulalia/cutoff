const { Pool } = require("pg");
const { databaseOptions } = require("../config");
let pool;
function getPool() {
  if (!pool) pool = new Pool(databaseOptions());
  return pool;
}
async function transaction(database, work) {
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
module.exports = { getPool, transaction };
