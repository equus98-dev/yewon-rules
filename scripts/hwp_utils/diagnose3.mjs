import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  host: 'aws-1-ap-northeast-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.jagpwxgasudlnaoxfroe',
  password: 'Tmtmfh0022$&*',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

// Failing rule IDs from batch test
const failingIds = [
  'dc43a03d-0566-4774-8f0c-b58c75ae6aaa',
  'b45e669f-0247-4098-aec4-59bb1848b0cf',
];

async function run() {
  try {
    for (const id of failingIds) {
      console.log('\n=== Testing rule:', id, '===');
      
      // Get revisions
      const revRes = await pool.query('SELECT id, version FROM "Revision" WHERE "ruleId" = $1 ORDER BY version DESC', [id]);
      console.log('Revisions:', revRes.rows.length, revRes.rows.map(r => r.version));
      
      if (!revRes.rows[0]) continue;
      const revId = revRes.rows[0].id;
      
      // Get articles - check for problematic data
      const artRes = await pool.query(`SELECT id, "sortOrder", "articleNumber", title, 
        length("contentJson"::text) as json_len, length("contentHtml") as html_len
        FROM "Article" WHERE "revisionId" = $1 ORDER BY "sortOrder"`, [revId]);
      console.log('Articles count:', artRes.rows.length);
      artRes.rows.slice(0, 5).forEach(a => {
        console.log(`  - artNum=${a.articleNumber}, sortOrder=${a.sortOrder}, jsonLen=${a.json_len}, htmlLen=${a.html_len}`);
      });
      
      // Check comparison query - this is likely the failing query
      try {
        const compRes = await pool.query(`SELECT ac.id FROM "ArticleComparison" ac WHERE ac."revisionId" = $1`, [revId]);
        console.log('Comparisons count:', compRes.rows.length);
      } catch(e) {
        console.log('COMPARISON QUERY FAILED:', e.message);
      }
      
      // Check if ArticleComparison table exists
      try {
        const tableCheck = await pool.query(`SELECT COUNT(*) FROM "ArticleComparison" LIMIT 1`);
        console.log('ArticleComparison table total rows:', tableCheck.rows[0].count);
      } catch(e) {
        console.log('ARTICLEDCOMPARISON TABLE ERROR:', e.message);
      }
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await pool.end();
  }
}

run();
