const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
  await client.connect();
  const res = await client.query('SELECT r.id, r.version FROM "Revision" r JOIN "Rule" ru ON r."ruleId" = ru.id WHERE ru."ruleNumber" = \'2-0-2\' ORDER BY r.version DESC LIMIT 1');
  const rev = res.rows[0];
  console.log('Current Revision:', rev.id);
  const artRes = await client.query('SELECT a.id, a."articleNumber", a."revisionId", a."contentJson" FROM "Article" a WHERE a."revisionId" = $1 AND a."articleNumber" = 3 ORDER BY a."sortOrder"', [rev.id]);
  
  for (let art of artRes.rows) {
      console.log(`Article 3 ID: ${art.id}, revisionId: ${art.revisionId}`);
      console.log(`Text: ${art.contentJson?.[0]?.text?.substring(0, 150)}`);
  }
  await client.end();
}
run();
