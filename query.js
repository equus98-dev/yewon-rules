const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres'
});
async function run() {
  const res = await pool.query(`SELECT a.id, a."articleNumber", a."contentText", a."contentJson"
    FROM "Article" a 
    JOIN "Revision" rev ON a."revisionId" = rev.id
    JOIN "Rule" r ON rev."ruleId" = r.id
    WHERE r.title LIKE '%일반대학원 학사운영 규정%' AND a."articleNumber" = 57
    ORDER BY rev.version DESC`);
  console.log(JSON.stringify(res.rows, null, 2));
  process.exit(0);
}
run();
