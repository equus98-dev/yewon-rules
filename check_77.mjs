import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const res = await pool.query(`
    SELECT a."articleNumber", a."contentJson"
    FROM "Article" a
    JOIN "Revision" rv ON a."revisionId" = rv.id
    JOIN "Rule" r ON rv."ruleId" = r.id
    WHERE r.title LIKE '%정관%' AND a."articleNumber" >= 77
    ORDER BY a."articleNumber" ASC
  `);
  
  for (const r of res.rows) {
     console.log(`=== 제${r.articleNumber}조 ===`);
     const json = typeof r.contentJson === 'string' ? JSON.parse(r.contentJson) : r.contentJson;
     console.log(json.map(i => i.type).join(', '));
     
     // Check if it has addendum
     for (const i of json) {
       if (i.text && i.text.includes('부칙')) {
         console.log('  -> Has Addendum: ' + i.text.substring(0, 50));
       }
     }
  }
  pool.end();
})();
