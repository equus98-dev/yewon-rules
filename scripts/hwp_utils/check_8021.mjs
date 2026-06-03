import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
     const res = await pool.query(`SELECT "contentJson" FROM "Article" WHERE id = '5517b714-1440-41f7-9fd0-993771a7ba35'`);
     console.log(JSON.stringify(res.rows[0].contentJson, null, 2));
  } catch (e) {
     console.error(e);
  } finally {
     pool.end();
  }
})();
