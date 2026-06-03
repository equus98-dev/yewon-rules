import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
     const res = await pool.query(`
        SELECT a.id, a."articleNumber", a.title, 
        (length(a."contentHtml") - length(replace(a."contentHtml", '<table', ''))) / 6 as table_count_html,
        (length(a."contentJson"::text) - length(replace(a."contentJson"::text, '<table', ''))) / 6 as table_count_json
        FROM "Article" a 
        JOIN "Revision" rev ON a."revisionId" = rev.id 
        JOIN "Rule" r ON rev."ruleId" = r.id 
        WHERE r.title LIKE '%산학협력단 운영규정%'
        ORDER BY a."articleNumber" ASC
     `);
     console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
     console.error(e);
  } finally {
     pool.end();
  }
})();
