const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function main() {
  const client = await pool.connect();
  try {
    const revId = 'cdd5bbad-f40b-4177-a37f-8b099516f24b';
    const res = await client.query(`SELECT "articleNumber", title, "contentText" FROM "Article" WHERE "revisionId" = $1 ORDER BY "sortOrder" ASC`, [revId]);
    res.rows.forEach(a => console.log(`[${a.articleNumber}] ${a.title}: ${a.contentText}`));
  } catch (err) {
    console.error("Error occurred:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();



