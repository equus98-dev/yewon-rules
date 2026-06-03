import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
     const res = await pool.query(`SELECT title FROM "Rule" WHERE title LIKE '%직제%'`);
     console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
     console.error(e);
  } finally {
     pool.end();
  }
})();
