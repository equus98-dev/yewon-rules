const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  const res = await client.query(`SELECT a."contentJson" FROM "Article" a JOIN "Revision" r ON a."revisionId" = r.id JOIN "Rule" ru ON r."ruleId" = ru.id WHERE ru."ruleNumber" = '3-4-1' AND a."articleNumber" = 19 ORDER BY r.version DESC LIMIT 1`);
  console.log(JSON.stringify(res.rows[0].contentJson, null, 2));
  await client.end();
}
run();
