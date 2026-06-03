import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const res = await pool.query('SELECT title, "articleNumber", "sortOrder" FROM "Article" WHERE "articleNumber" >= 9000 LIMIT 10');
  console.log('Attachments:', res.rows);

  const res2 = await pool.query('SELECT title, "articleNumber", "sortOrder" FROM "Article" WHERE "articleNumber" < 9000 LIMIT 10');
  console.log('Normal:', res2.rows);

  pool.end();
})();
