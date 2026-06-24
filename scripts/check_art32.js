const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: "postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true" });
  await client.connect();
  const res = await client.query(`
    SELECT a.id, a."contentText", a."contentHtml", a."contentJson" 
    FROM "Article" a 
    JOIN "Revision" r ON a."revisionId" = r.id 
    JOIN "Rule" ru ON r."ruleId" = ru.id 
    WHERE ru."ruleNumber" = '2-0-2' AND a."articleNumber" = 32
  `);
  console.log(res.rows[0].contentText);
  await client.end();
}
run();
