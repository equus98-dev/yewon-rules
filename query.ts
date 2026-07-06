import { pool } from './src/lib/db';
async function run() {
  const res = await pool.query(`SELECT r.title, a.id, a."articleNumber", a.title as art_title, a."contentText"
    FROM "Article" a 
    JOIN "Revision" rev ON a."revisionId" = rev.id
    JOIN "Rule" r ON rev."ruleId" = r.id
    WHERE r.title LIKE '%일반대학원 학사운영 규정%' AND a."articleNumber" IN (61, 62, 63)
    ORDER BY a."articleNumber" ASC LIMIT 10`);
  console.log(JSON.stringify(res.rows, null, 2));
  process.exit(0);
}
run();
