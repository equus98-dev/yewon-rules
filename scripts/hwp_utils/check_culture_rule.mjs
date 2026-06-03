import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
     const res = await pool.query(`
       SELECT a.id, a."articleNumber", a.title, a."contentJson", a."contentHtml"
       FROM "Rule" r 
       JOIN "Revision" rev ON r.id=rev."ruleId" 
       JOIN "Article" a ON rev.id=a."revisionId" 
       WHERE r.title LIKE '%문화예술대학원 학사운영 규정%' 
       AND a."articleNumber" >= 8000
       ORDER BY a."sortOrder"
     `);
     for (const row of res.rows) {
        console.log(`--- [${row.articleNumber}] ${row.title} ---`);
        console.log("JSON:", JSON.stringify(row.contentJson, null, 2));
        console.log("HTML:", row.contentHtml?.substring(0, 100));
     }
  } catch (e) {
     console.error(e);
  } finally {
     pool.end();
  }
})();
