const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
  await client.connect();
  const res = await client.query('SELECT r.id FROM "Rule" r WHERE r."ruleNumber" = \'2-0-2\'');
  const ruleId = res.rows[0].id;
  await client.end();
  
  const apiRes = await fetch(`https://yewon-rules.vercel.app/api/rules/${ruleId}?t=${Date.now()}`);
  const data = await apiRes.json();
  const art3 = data.articles.find(a => a.articleNumber === 3);
  console.log('Article 3 contentJson text:');
  console.log(JSON.parse(art3.contentJson)[0].text);
}
run();
