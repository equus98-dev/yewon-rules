import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  host: 'aws-1-ap-northeast-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.jagpwxgasudlnaoxfroe',
  password: 'Tmtmfh0022$&*',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    // 1. Check all rules exist
    const rulesRes = await pool.query('SELECT id, title FROM "Rule" ORDER BY "ruleNumber" LIMIT 10');
    console.log('Sample rules:', JSON.stringify(rulesRes.rows, null, 2));
    
    // 2. Test first rule's API
    const firstId = rulesRes.rows[0]?.id;
    if (firstId) {
      console.log('\nTesting rule ID:', firstId);
      const revRes = await pool.query('SELECT id, version FROM "Revision" WHERE "ruleId" = $1', [firstId]);
      console.log('Revisions count:', revRes.rows.length);
      
      if (revRes.rows[0]) {
        const artRes = await pool.query('SELECT id FROM "Article" WHERE "revisionId" = $1 LIMIT 5', [revRes.rows[0].id]);
        console.log('Articles count for first revision:', artRes.rowCount);
      }
    }
    
    // 3. Test live API
    console.log('\nTesting live API...');
    const liveRes = await fetch(`https://yewon-rules.pages.dev/api/rules/${firstId}`);
    console.log('Live API status:', liveRes.status);
    const liveData = await liveRes.json();
    if (liveData.error) {
      console.log('Live API error:', liveData.error);
    } else {
      console.log('Live API title:', liveData.title);
      console.log('Live API revisions:', liveData.revisions?.length);
      console.log('Live API articles:', liveData.currentRevision?.articles?.length);
    }
    
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await pool.end();
  }
}

run();
