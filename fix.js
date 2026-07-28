const { Client } = require('pg');
async function checkDB() {
  const client = new Client({ connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
  await client.connect();
  const res = await client.query(`SELECT id, "articleNumber", "contentHtml" FROM "Article" WHERE "articleNumber" IN (61, 62, 63) AND "revisionId" = (SELECT id FROM "Revision" WHERE "ruleId" = (SELECT id FROM "Rule" WHERE title LIKE '%일반대학원 학사운영 규정%') ORDER BY version DESC LIMIT 1) ORDER BY "articleNumber"`);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
checkDB();
