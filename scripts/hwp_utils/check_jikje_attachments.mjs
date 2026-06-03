import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
     const res = await pool.query(`
        SELECT a.id, a."articleNumber", a.title, a."contentJson", a."contentHtml"
        FROM "Article" a
        JOIN "Revision" rv ON a."revisionId" = rv.id
        JOIN "Rule" r ON rv."ruleId" = r.id
        WHERE r.title LIKE '%직제 규정%' AND a."articleNumber" >= 9000
        ORDER BY a."sortOrder" ASC
     `);
     console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
     console.error(e.message);
  } finally {
     pool.end();
  }
})();
