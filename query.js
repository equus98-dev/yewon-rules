const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres'
});
async function run() {
  const revRes = await pool.query(`SELECT id, version, "versionName", "enactmentDate" FROM "Revision" WHERE "ruleId" = '526db4d2-bca1-49c2-a890-22541179286e' ORDER BY version DESC`);
  console.log("All revisions:", JSON.stringify(revRes.rows, null, 2));
  process.exit(0);
}
run();
