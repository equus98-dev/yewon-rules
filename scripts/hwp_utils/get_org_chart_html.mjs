import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
     const res = await pool.query(`SELECT "contentJson" FROM "Article" WHERE id = 'f37ad201-f941-4116-9c3a-f2989695abff'`);
     console.log(JSON.stringify(res.rows[0].contentJson, null, 2));
  } catch (e) {
     console.error(e);
  } finally {
     pool.end();
  }
})();
