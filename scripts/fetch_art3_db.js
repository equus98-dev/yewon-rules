const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
  await client.connect();
  const res = await client.query('SELECT "contentJson", "title" FROM "Article" WHERE "articleNumber" IN (3, 3.2) ORDER BY "sortOrder" ASC LIMIT 5');
  console.log(JSON.stringify(res.rows, null, 2));
  client.end();
}
run();
