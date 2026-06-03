import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
     const res = await pool.query(`
       SELECT a.id, a."articleNumber", a.title, a."contentJson" 
       FROM "Rule" r 
       JOIN "Revision" rev ON r.id=rev."ruleId" 
       JOIN "Article" a ON rev.id=a."revisionId" 
       WHERE r.title LIKE '%교원 징계규정%' 
       ORDER BY a."sortOrder"
     `);
     for (const row of res.rows) {
        if(row.articleNumber >= 8000) {
           console.log(`--- ${row.title} ---`);
           console.log(JSON.stringify(row.contentJson, null, 2));
        }
     }
  } catch (e) {
     console.error(e);
  } finally {
     pool.end();
  }
})();
