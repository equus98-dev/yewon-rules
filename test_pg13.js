const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT DISTINCT ru.title
    FROM "Rule" ru
    WHERE ru.title LIKE '%예원예술대학교 정관%'
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
run();
