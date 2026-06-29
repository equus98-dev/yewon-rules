const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function main() {
  const client = await pool.connect();
  try {
    const rulesRes = await client.query(`SELECT * FROM "Rule" WHERE title LIKE '%IR%'`);
    console.log("Rules:", JSON.stringify(rulesRes.rows, null, 2));
    
    if (rulesRes.rows.length > 0) {
      const revRes = await client.query(`SELECT * FROM "Revision" WHERE "ruleId" = $1`, [rulesRes.rows[0].id]);
      console.log("Revisions:", JSON.stringify(revRes.rows, null, 2));
    }
  } catch (err) {
    console.error("Error occurred:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
