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
    // Get all rules
    const rulesRes = await pool.query('SELECT id, title, "ruleNumber" FROM "Rule" ORDER BY "ruleNumber"');
    
    // Find rules with large articles
    let bigRules = [];
    
    for (const rule of rulesRes.rows) {
      const revRes = await pool.query('SELECT id FROM "Revision" WHERE "ruleId" = $1 ORDER BY version DESC LIMIT 1', [rule.id]);
      if (!revRes.rows[0]) continue;
      
      // Check total content size for this revision
      const sizeRes = await pool.query(
        `SELECT COUNT(*)::int as art_count, SUM(length("contentJson"::text))::int as total_json_size
         FROM "Article" WHERE "revisionId" = $1`,
        [revRes.rows[0].id]
      );
      
      const artCount = sizeRes.rows[0].art_count;
      const totalSize = sizeRes.rows[0].total_json_size || 0;
      
      if (artCount > 100 || totalSize > 500000) {
        bigRules.push({
          id: rule.id,
          title: rule.title,
          ruleNumber: rule.ruleNumber,
          artCount,
          totalSizeKB: (totalSize / 1024).toFixed(1)
        });
      }
    }
    
    console.log('Rules with large content (>100 articles or >500KB contentJson):');
    bigRules.forEach(r => console.log(`  [${r.ruleNumber}] ${r.title}: ${r.artCount} articles, ${r.totalSizeKB}KB`));
    
    // Also check the failing ones specifically
    const failingIds = [
      'dc43a03d-0566-4774-8f0c-b58c75ae6aaa',
      'b45e669f-0247-4098-aec4-59bb1848b0cf',
      'f2d6fa0c-ea7e-4a89-b72b-e991017e0b28',
    ];
    
    console.log('\nSpecific checks for known failing rules:');
    for (const id of failingIds) {
      const rule = rulesRes.rows.find(r => r.id === id);
      if (!rule) continue;
      
      const revRes = await pool.query('SELECT id FROM "Revision" WHERE "ruleId" = $1 ORDER BY version DESC LIMIT 1', [id]);
      if (!revRes.rows[0]) { console.log(`  ${rule.title}: No revision!`); continue; }
      
      const sizeRes = await pool.query(
        `SELECT COUNT(*)::int as art_count, COALESCE(SUM(length("contentJson"::text)), 0)::int as total_json_size,
         COUNT(CASE WHEN "contentHtml" IS NOT NULL THEN 1 END)::int as has_html
         FROM "Article" WHERE "revisionId" = $1`,
        [revRes.rows[0].id]
      );
      
      const row = sizeRes.rows[0];
      console.log(`  [${rule.ruleNumber}] ${rule.title}:`);
      console.log(`    articles: ${row.art_count}, json_size: ${(row.total_json_size/1024).toFixed(1)}KB, html_articles: ${row.has_html}`);
      
      // Test live API response
      const liveRes = await fetch(`https://yewon-rules.pages.dev/api/rules/${id}`);
      const liveText = await liveRes.text();
      console.log(`    live API: status=${liveRes.status}, response=${liveText.slice(0,200)}`);
    }
    
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await pool.end();
  }
}

run();
