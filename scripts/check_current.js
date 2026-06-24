const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
  await client.connect();
  const res = await client.query('SELECT r.id, r."currentRevisionId" FROM "Rule" r WHERE r."ruleNumber" = \'2-0-2\'');
  const rule = res.rows[0];
  console.log('Current Revision:', rule.currentRevisionId);
  const artRes = await client.query('SELECT a.id, a."articleNumber", a."revisionId", a."contentJson" FROM "Article" a WHERE a."revisionId" = $1 ORDER BY a."sortOrder"', [rule.currentRevisionId]);
  
  for (let art of artRes.rows) {
      if (art.articleNumber === 3) {
          console.log(`Article 3 ID: ${art.id}, revisionId: ${art.revisionId}`);
          console.log(`Text: ${art.contentJson?.[0]?.text?.substring(0, 50)}`);
      }
  }
  await client.end();
}
run();
