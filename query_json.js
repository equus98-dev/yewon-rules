const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  await client.connect();

  const res = await client.query(`
    SELECT a.id, a.title, a."contentJson", a."contentText", r."ruleNumber" 
    FROM "Article" a 
    JOIN "Revision" rev ON a."revisionId" = rev.id 
    JOIN "Rule" r ON rev."ruleId" = r.id 
    WHERE r."ruleNumber" = $1 AND a."articleNumber" >= 8000
  `, ['1-0-2']);

  console.log(JSON.stringify(res.rows[0], null, 2));
  await client.end();
}

main().catch(console.error);
