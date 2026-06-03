import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
     const res = await pool.query(`
       SELECT a."articleNumber", a.title, a."contentJson" 
       FROM "Article" a
       JOIN "Revision" rev ON a."revisionId" = rev.id
       JOIN "Rule" r ON rev."ruleId" = r.id
       WHERE r.title = '직제 규정'
       ORDER BY a."sortOrder"
     `);
     let count = 0;
     for (const row of res.rows) {
        if(count > 10) break;
        count++;
        console.log(`--- 제${row.articleNumber}조 ${row.title} ---`);
        if (row.contentJson && Array.isArray(row.contentJson)) {
           row.contentJson.forEach(item => {
              if (item.type === 'article' || item.type === 'paragraph' || item.type === 'item') {
                 console.log(item.num || '', item.text);
              }
           });
        }
     }
  } catch (e) {
     console.error(e);
  } finally {
     pool.end();
  }
})();
