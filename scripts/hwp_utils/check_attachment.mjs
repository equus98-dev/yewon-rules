import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
     const res = await pool.query(`SELECT id, title FROM "Rule" WHERE title LIKE '%학업이수에 관한 규정%'`);
     console.log(res.rows);
     if (res.rows.length > 0) {
       const att = await pool.query(`SELECT "fileUrl", "fileType" FROM "Attachment" WHERE "ruleId" = $1`, [res.rows[0].id]);
       console.log(att.rows);
     }
  } catch (e) {
     console.error(e);
  } finally {
     pool.end();
  }
})();
