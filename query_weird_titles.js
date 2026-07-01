const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  await client.connect();

  const res = await client.query(`
    SELECT r."ruleNumber", a.title 
    FROM "Article" a 
    JOIN "Revision" rev ON a."revisionId" = rev.id 
    JOIN "Rule" r ON rev."ruleId" = r.id 
    WHERE a.title LIKE '%칙%'
  `);

  const weird = res.rows.filter(r => r.title.includes('칙') && r.title !== '부칙');
  console.log('Total rules with 칙:', res.rows.length);
  console.log('Weird titles:', weird.slice(0, 20));
  await client.end();
}

main().catch(console.error);
