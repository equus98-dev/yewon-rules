const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT a.id, a."title", a."contentText", a."articleNumber"
    FROM "Article" a 
    WHERE a."title" = '칙' OR a."title" LIKE '%칙'
  `);
  console.log(JSON.stringify(res.rows.map(r => ({id: r.id, title: r.title})), null, 2));
  await client.end();
}
run();
