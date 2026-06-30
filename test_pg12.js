const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT a.id, a.title, a."contentText", a."contentJson", a."articleNumber"
    FROM "Article" a 
    JOIN "Revision" r ON a."revisionId" = r.id 
    JOIN "Rule" ru ON r."ruleId" = ru.id
    WHERE ru.title = '1-0-1 학교법인 예원예술대학교 정관' AND a.title = '부칙'
    ORDER BY a."articleNumber"
  `);
  console.log(JSON.stringify(res.rows.slice(0, 5), null, 2));
  await client.end();
}
run();
