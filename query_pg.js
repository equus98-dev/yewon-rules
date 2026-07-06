const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({ connectionString: process.env.POSTGRES_URL + "?sslmode=require" });
  await client.connect();
  try {
    const res = await client.query(`SELECT id, "articleNumber", title, chapter, section FROM "Article" WHERE "articleNumber" IN (61, 62, 63) ORDER BY "createdAt" DESC LIMIT 10`);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run().catch(console.error);
