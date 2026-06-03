import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
     const res = await pool.query(`
        SELECT a.id, a.title, r.title as rule_title 
        FROM "Article" a 
        JOIN "Revision" rev ON a."revisionId" = rev.id 
        JOIN "Rule" r ON rev."ruleId" = r.id 
        WHERE r.title LIKE '%산학협력단 운영규정%' AND a."articleNumber" >= 9000
     `);
     console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
     console.error(e);
  } finally {
     pool.end();
  }
})();
