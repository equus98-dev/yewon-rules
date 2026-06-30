const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT a."articleNumber", a.title, a."contentText"
    FROM "Article" a 
    JOIN "Revision" r ON a."revisionId" = r.id 
    JOIN "Rule" ru ON r."ruleId" = ru.id
    WHERE ru.title = '학교법인 예원예술대학교 정관' AND r.status = 'EFFECTIVE'
      AND a."articleNumber" >= 8000 AND a."articleNumber" <= 9000
    ORDER BY a."articleNumber"
  `);
  console.log(JSON.stringify(res.rows.map(r => ({num: r.articleNumber, title: r.title, text: r.contentText.substring(0, 30)})), null, 2));
  await client.end();
}
run();
