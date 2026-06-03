import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
     const res = await pool.query(`SELECT COUNT(*) FROM "Article" WHERE "contentHtml" IS NOT NULL`);
     console.log('Manual edits:', res.rows[0].count);
  } catch (e) {
     console.error(e);
  } finally {
     pool.end();
  }
})();
