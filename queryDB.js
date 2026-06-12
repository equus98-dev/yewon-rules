const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: "postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const res = await pool.query(`SELECT id, title, "contentText" FROM "Article" WHERE title LIKE '%제777조%' OR "contentText" LIKE '%제777조%'`);
    console.log(`Found ${res.rowCount} articles.`);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
