import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
     const res = await pool.query(`
        SELECT title, "contentJson"
        FROM "Article"
        WHERE id = '94fc56a4-913e-4b96-8fd3-e622412222bb'
     `);
     console.log(res.rows[0]);
  } catch (e) {
     console.error(e.message);
  } finally {
     pool.end();
  }
})();
