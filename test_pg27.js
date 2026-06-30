const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT a."contentText", a."contentJson"
    FROM "Article" a 
    WHERE a.id = '6b7798ba-a7e2-44f5-ba51-13cd2aad7e3b'
  `);
  console.log(JSON.stringify(res.rows[0], null, 2));
  await client.end();
}
run();
