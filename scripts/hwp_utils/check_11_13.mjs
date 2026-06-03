import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
     const res = await pool.query(`
       SELECT a.id, a."articleNumber", a.title, a."contentJson" 
       FROM "Article" a 
       JOIN "Revision" rev ON a."revisionId" = rev.id 
       JOIN "Rule" r ON rev."ruleId" = r.id 
       WHERE r.title LIKE '%학교법인 예원예술대학교 정관%' AND a."articleNumber" >= 11 AND a."articleNumber" <= 13
       ORDER BY a."sortOrder"
     `);
     console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
     console.error(e);
  } finally {
     pool.end();
  }
})();
