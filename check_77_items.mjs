import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const res = await pool.query(`
    SELECT a."contentJson"
    FROM "Article" a
    JOIN "Revision" rv ON a."revisionId" = rv.id
    JOIN "Rule" r ON rv."ruleId" = r.id
    WHERE r.title LIKE '%정관%' AND a."articleNumber" = 77
  `);
  
  const json = typeof res.rows[0].contentJson === 'string' ? JSON.parse(res.rows[0].contentJson) : res.rows[0].contentJson;
  for (const [idx, item] of json.entries()) {
    console.log(`[${idx}] ${item.type} | ${item.num} | ${item.text.substring(0, 50)}`);
  }
  pool.end();
})();
