const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres' });
client.connect().then(() => client.query(`
  SELECT a.id, a."articleNumber", a."contentJson" 
  FROM "Article" a 
  JOIN "Revision" r ON a."revisionId" = r.id 
  WHERE r."ruleId" = 'ba1e19c0-9eec-48cc-bd08-a20bc46b5158' 
    AND a."articleNumber" = 19
  ORDER BY r."createdAt" DESC LIMIT 1
`))
  .then(res => console.log(JSON.stringify(res.rows, null, 2)))
  .finally(() => client.end());
