const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT r.id as rev_id, ru.status, a.id, a.title, a."contentText", a."contentJson"
    FROM "Article" a 
    JOIN "Revision" r ON a."revisionId" = r.id 
    JOIN "Rule" ru ON r."ruleId" = ru.id
    WHERE ru.title = '학교법인 예원예술대학교 정관' AND a.title = '부칙'
    ORDER BY r."createdAt" DESC
  `);
  console.log(JSON.stringify(res.rows.map(row => ({
    status: row.status,
    title: row.title,
    contentJsonText: (row.contentJson && Array.isArray(row.contentJson) && row.contentJson.length > 0) ? row.contentJson[0].text : null
  })), null, 2));
  await client.end();
}
run();
