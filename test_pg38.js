const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT a."articleNumber", a.title, ru.title as rule_title
    FROM "Article" a 
    JOIN "Revision" r ON a."revisionId" = r.id 
    JOIN "Rule" ru ON r."ruleId" = ru.id
    WHERE a.title LIKE '%법령등의 준용%'
    LIMIT 5
  `);
  console.log(res.rows);
  await client.end();
}
run();
