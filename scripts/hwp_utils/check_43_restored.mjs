import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
     const res = await pool.query(`
        SELECT a.id, a."articleNumber", a.title
        FROM "Article" a
        JOIN "Revision" rv ON a."revisionId" = rv.id
        JOIN "Rule" r ON rv."ruleId" = r.id
        WHERE r.title LIKE '%학업이수에 관한 규정%' AND a."articleNumber" IN (42, 43)
        ORDER BY a."articleNumber" ASC, a."sortOrder" ASC
     `);
     console.log(res.rows.map(r => `${r.articleNumber}: ${r.title}`).join('\n'));
  } catch (e) {
     console.error(e.message);
  } finally {
     pool.end();
  }
})();
