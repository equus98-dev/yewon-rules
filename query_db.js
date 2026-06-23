const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });

pool.query(`SELECT a.id, a."articleNumber", a.title, a."contentText", a."contentJson", a."contentHtml" FROM "Article" a JOIN "Revision" rev ON a."revisionId" = rev.id JOIN "Rule" r ON rev."ruleId" = r.id WHERE r."ruleNumber" = '2-0-2' AND a."articleNumber" IN (31, 32) ORDER BY a."articleNumber" ASC`)
  .then(res => { console.log(res.rows.map(r => ({ ...r, contentHtml: r.contentHtml ? r.contentHtml.length : null }))); pool.end(); })
  .catch(err => { console.error(err); pool.end(); });
