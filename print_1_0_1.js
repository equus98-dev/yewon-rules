const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  await client.connect();

  const res = await client.query(`
    SELECT a.id, a.title, a."contentText", a."contentJson"
    FROM "Article" a 
    JOIN "Revision" rev ON a."revisionId" = rev.id 
    JOIN "Rule" r ON rev."ruleId" = r.id 
    WHERE r."ruleNumber" = $1 AND a."articleNumber" >= 8000
    ORDER BY a."articleNumber" ASC
  `, ['1-0-1']);

  res.rows.forEach(r => {
    console.log(`Title: ${r.title}`);
    if (r.contentJson) {
      r.contentJson.forEach(item => {
        if (item.text) console.log(` - ${item.text.substring(0, 50)}`);
      });
    } else if (r.contentText) {
      console.log(` - Text: ${r.contentText.substring(0, 50)}`);
    }
  });

  await client.end();
}

main().catch(console.error);
