import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
     const res = await pool.query(`SELECT "contentJson" FROM "Article" WHERE id = '5b9d34bc-ae8a-4651-9dba-3d76b96bb074'`);
     let items = res.rows[0].contentJson;
     console.log('Original length:', items.length);
     items = items.filter(i => !(i.type === 'text' && (i.text.includes('<table') || i.text.includes('조직도'))));
     console.log('New length:', items.length);
     await pool.query(`UPDATE "Article" SET "contentJson" = $1 WHERE id='5b9d34bc-ae8a-4651-9dba-3d76b96bb074'`, [JSON.stringify(items)]);
     console.log('Updated DB successfully');
  } catch (e) {
     console.error(e);
  } finally {
     pool.end();
  }
})();
