import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const res = await pool.query('SELECT r.title as rule_title, a.title, a."articleNumber", a."sortOrder" FROM "Article" a JOIN "Revision" rv ON a."revisionId" = rv.id JOIN "Rule" r ON rv."ruleId" = r.id WHERE a."articleNumber" >= 9000 LIMIT 10');
  console.log('Attachments:', res.rows);

  pool.end();
})();
