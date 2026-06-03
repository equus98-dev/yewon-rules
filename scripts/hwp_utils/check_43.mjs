import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
     const res = await pool.query(`
        SELECT a.id, a."articleNumber", a.title, a."contentJson"
        FROM "Article" a
        JOIN "Revision" rv ON a."revisionId" = rv.id
        JOIN "Rule" r ON rv."ruleId" = r.id
        WHERE r.title LIKE '%학업이수에 관한 규정%' AND a."articleNumber" IN (42, 43, 44)
        ORDER BY a."articleNumber" ASC
     `);
     console.log(res.rows);
  } catch (e) {
     console.error(e.message);
  } finally {
     pool.end();
  }
})();
