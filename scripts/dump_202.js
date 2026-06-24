const fs = require('fs');
const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: "postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true" });
  await client.connect();

  const res = await client.query(`
    SELECT a.id, a."articleNumber", a.title, a."contentText", a."contentJson", a."contentHtml", r.id as "revisionId", a.part, a.chapter, a.section, a."subSection", a."sortOrder"
    FROM "Article" a
    JOIN "Revision" r ON a."revisionId" = r.id
    JOIN "Rule" ru ON r."ruleId" = ru.id
    WHERE ru."ruleNumber" = '2-0-2'
    ORDER BY a."sortOrder" ASC
  `);
  
  fs.writeFileSync('docs/202_db_dump.json', JSON.stringify(res.rows, null, 2));
  console.log("Dumped 202 to docs/202_db_dump.json");
  await client.end();
}
run();
