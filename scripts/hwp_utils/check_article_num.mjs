import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
     const res = await pool.query(`
       SELECT a.id, a."articleNumber", a.title
       FROM "Rule" r 
       JOIN "Revision" rev ON r.id=rev."ruleId" 
       JOIN "Article" a ON rev.id=a."revisionId" 
       WHERE r.title LIKE '%교원 징계규정%' 
       AND a."articleNumber" >= 8000
       ORDER BY a."sortOrder"
     `);
     console.log(res.rows);
  } catch (e) {
     console.error(e);
  } finally {
     pool.end();
  }
})();
