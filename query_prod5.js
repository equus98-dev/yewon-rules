const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres' });
client.connect().then(() => client.query(`SELECT id, title FROM "Rule" WHERE title LIKE '%장학%'`))
  .then(res => console.log(JSON.stringify(res.rows, null, 2)))
  .finally(() => client.end());
