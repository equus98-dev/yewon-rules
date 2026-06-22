const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function main() {
  try {
    const res = await pool.query(`SELECT id, "ruleNumber", title FROM "Rule" WHERE "ruleNumber" = '5-1-1'`);
    if (res.rows.length === 0) {
      console.log('No rule found');
      return;
    }
    const rule = res.rows[0];
    console.log(`Found rule: ${rule.ruleNumber} ${rule.title}`);
    
    const revRes = await pool.query(`SELECT id, version FROM "Revision" WHERE "ruleId" = $1 ORDER BY version DESC LIMIT 1`, [rule.id]);
    if (revRes.rows.length === 0) {
      console.log('No revision found');
      return;
    }
    const revision = revRes.rows[0];
    console.log(`Found revision: ${revision.id}`);
    
    const artRes = await pool.query(`SELECT id, "articleNumber", title, "contentJson", "contentHtml", "contentText" FROM "Article" WHERE "revisionId" = $1 ORDER BY "articleNumber" ASC`, [revision.id]);
    fs.writeFileSync('pg_articles.json', JSON.stringify(artRes.rows, null, 2), 'utf8');
    console.log(`Exported ${artRes.rows.length} articles to pg_articles.json`);
    
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
