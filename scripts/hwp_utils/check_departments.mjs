import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
     const res = await pool.query(`SELECT id, name FROM "Department"`);
     console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
     console.error(e);
  } finally {
     pool.end();
  }
})();
