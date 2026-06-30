const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT a."articleNumber", a.title, a."contentText", ru.title as rule_title, ru.status
    FROM "Article" a 
    JOIN "Revision" r ON a."revisionId" = r.id 
    JOIN "Rule" ru ON r."ruleId" = ru.id
    WHERE a."contentText" LIKE '%본 정관에 규정되지 아니한 사항은%'
    LIMIT 5
  `);
  console.log(res.rows);
  await client.end();
}
run();
