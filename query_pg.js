const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  });
  await client.connect();

  const res = await client.query(`
    SELECT r."ruleNumber", a."title", a."contentHtml", a."contentText" 
    FROM "Rule" r
    JOIN "Revision" rev ON r.id = rev."ruleId"
    JOIN "Article" a ON rev.id = a."revisionId"
    WHERE r."ruleNumber" IN ('2-0-2', '1-0-1')
      AND rev."status" = 'CURRENT'
      AND (a."articleNumber" >= 8000 OR a."title" LIKE '%부%' OR a."title" LIKE '%칙%')
  `);
  
  console.log(JSON.stringify(res.rows, null, 2));

  await client.end();
}

main().catch(console.error);
