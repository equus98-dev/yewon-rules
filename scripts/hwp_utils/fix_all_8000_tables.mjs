import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
     const res = await pool.query(`SELECT id, "contentJson" FROM "Article" WHERE "articleNumber" >= 8000 AND "articleNumber" < 9000`);
     let updatedCount = 0;
     for (const row of res.rows) {
        if (!row.contentJson) continue;
        const originalLength = row.contentJson.length;
        const items = row.contentJson.filter(i => !(i.type === 'text' && (i.text.includes('<table') || i.text.includes('조직도'))));
        if (items.length !== originalLength) {
           await pool.query(`UPDATE "Article" SET "contentJson" = $1 WHERE id = $2`, [JSON.stringify(items), row.id]);
           updatedCount++;
        }
     }
     console.log(`Updated ${updatedCount} articles`);
  } catch (e) {
     console.error(e);
  } finally {
     pool.end();
  }
})();
