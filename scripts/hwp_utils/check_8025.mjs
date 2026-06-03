import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
     const res = await pool.query(`SELECT "contentJson" FROM "Article" WHERE id = '5b9d34bc-ae8a-4651-9dba-3d76b96bb074'`);
     console.log(JSON.stringify(res.rows[0].contentJson, null, 2).substring(0, 1000));
  } catch (e) {
     console.error(e);
  } finally {
     pool.end();
  }
})();
