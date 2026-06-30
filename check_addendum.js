const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT a.id, a."contentText", r."enactmentDate" 
    FROM "Article" a 
    JOIN "Revision" r ON a."revisionId" = r.id 
    WHERE a."articleNumber" >= 8000 
    AND (a."contentText" LIKE '%<신설%' OR a."contentText" LIKE '%<개정%')
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
run();
