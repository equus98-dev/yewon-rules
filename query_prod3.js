const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres' });
client.connect().then(() => client.query(`SELECT r.id, r.title, rev.version, rev."versionName", rev."enactmentDate" FROM "Rule" r JOIN "Revision" rev ON r.id = rev."ruleId" ORDER BY rev."createdAt" DESC LIMIT 10`))
  .then(res => console.log(JSON.stringify(res.rows, null, 2)))
  .finally(() => client.end());
