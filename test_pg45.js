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
    ORDER BY a."sortOrder" ASC
  `);
  // Find index of 8100
  const idx = res.rows.findIndex(r => r.articleNumber === 8100);
  if (idx > -1) {
    console.log("Before 8100:", res.rows.slice(Math.max(0, idx - 3), idx));
    console.log("8100:", res.rows[idx]);
    console.log("After 8100:", res.rows.slice(idx + 1, idx + 4));
  } else {
    console.log("8100 not found");
  }
  await client.end();
}
run();
