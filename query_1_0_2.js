const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  await client.connect();

  const res = await client.query(`
    SELECT a.id, a.title, r."ruleNumber" 
    FROM "Article" a 
    JOIN "Revision" rev ON a."revisionId" = rev.id 
    JOIN "Rule" r ON rev."ruleId" = r.id 
    WHERE r."ruleNumber" = $1 AND a."articleNumber" >= 8000
  `, ['1-0-2']);

  console.log(res.rows);
  await client.end();
}

main().catch(console.error);
