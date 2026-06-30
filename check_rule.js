const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  const res = await client.query(`SELECT r.id, r.title, r."ruleNumber" FROM "Rule" r WHERE r.title LIKE '%등록금심의위원회%'`);
  console.log(JSON.stringify(res.rows, null, 2));

  for (const rule of res.rows) {
    const res2 = await client.query(`SELECT id, version, "versionName" FROM "Revision" WHERE "ruleId" = $1 ORDER BY version DESC`, [rule.id]);
    console.log(`Revisions for ${rule.title}:`);
    console.log(JSON.stringify(res2.rows, null, 2));

    for (const rev of res2.rows) {
      const res3 = await client.query(`SELECT id, "articleNumber", "contentText" FROM "Article" WHERE "revisionId" = $1 AND "articleNumber" >= 8000`, [rev.id]);
      console.log(`Addendums for version ${rev.version}:`);
      console.log(JSON.stringify(res3.rows, null, 2));
    }
  }

  await client.end();
}
run();
