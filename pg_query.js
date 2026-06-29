const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function main() {
  const client = await pool.connect();
  try {
    const rulesRes = await client.query(`SELECT * FROM "Rule" WHERE title LIKE '%대학발전기금%'`);
    if (rulesRes.rows.length > 0) {
      const rule = rulesRes.rows[0];
      const revRes = await client.query(`SELECT * FROM "Revision" WHERE "ruleId" = $1 ORDER BY version DESC LIMIT 1`, [rule.id]);
      if (revRes.rows.length > 0) {
        const revId = revRes.rows[0].id;
        const artRes = await client.query(`SELECT "articleNumber", title, "contentText" FROM "Article" WHERE "revisionId" = $1 ORDER BY "sortOrder" ASC`, [revId]);
        artRes.rows.forEach(a => {
          console.log(`[${a.articleNumber}] ${a.title}`);
          if (a.articleNumber >= 8000 || (a.contentText || '').includes('별표') || (a.contentText || '').includes('별지')) {
            console.log(`--> Content: ${a.contentText?.substring(0, 500)}...`);
            if (a.articleNumber >= 8000) {
              console.log(`--> Full Addendum Length: ${a.contentText?.length}`);
            }
          }
        });
      }
    }
  } catch (err) {
    console.error("Error occurred:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();



