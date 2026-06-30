const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT a."articleNumber", a.title, a."sortOrder"
    FROM "Article" a 
    JOIN "Revision" r ON a."revisionId" = r.id 
    JOIN "Rule" ru ON r."ruleId" = ru.id
    WHERE ru.title = '학교법인 예원예술대학교 정관' 
      AND ru.status = 'EFFECTIVE'
      AND a."articleNumber" IN (8600, 8100)
    ORDER BY a."sortOrder" ASC
  `);
  console.log(res.rows);
  await client.end();
}
run();
