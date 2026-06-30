const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT a.id, a.title, a."contentText", a."contentJson", a."contentHtml"
    FROM "Article" a 
    WHERE a.id = '2d9c0255-e7da-4e4b-ae7c-2b5d43e2f5b6'
  `);
  console.log(JSON.stringify(res.rows[0], null, 2));
  await client.end();
}
run();
