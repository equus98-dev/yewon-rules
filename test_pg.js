const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  const res = await client.query(
    SELECT a.id, a."title", a."contentText"
    FROM "Article" a 
    JOIN "Revision" r ON a."revisionId" = r.id 
    JOIN "Rule" ru ON r."ruleId" = ru.id
    WHERE ru."title" LIKE '%정관%' AND a."articleNumber" >= 8000
  );
  console.log(JSON.stringify(res.rows.map(r => ({title: r.title, contentText: r.contentText.substring(0, 50)})), null, 2));
  await client.end();
}
run();
