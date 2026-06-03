import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
     const res = await pool.query('UPDATE "Article" SET "sortOrder" = "articleNumber" WHERE "articleNumber" >= 9000');
     console.log(`Updated ${res.rowCount} attachments to have correct sortOrder.`);
  } catch (e) {
     console.error(e.message);
  } finally {
     pool.end();
  }
})();
