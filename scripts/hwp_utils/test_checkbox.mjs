import { Pool } from "@neondatabase/serverless";

const connectionString = "postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres";

async function run() {
  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    const res = await pool.query(`
      SELECT r.title, a."contentJson"::text, a."contentHtml"
      FROM "Article" a
      JOIN "Revision" rev ON a."revisionId" = rev.id
      JOIN "Rule" r ON rev."ruleId" = r.id
      WHERE a."contentJson"::text ILIKE '%checkbox%'
         OR a."contentJson"::text ILIKE '%체크박스%'
         OR a."contentHtml" ILIKE '%checkbox%'
         OR a."contentHtml" ILIKE '%체크박스%'
    `);
    console.log(`Found ${res.rowCount} articles containing 'checkbox' or '체크박스'`);
    for (const row of res.rows) {
      console.log("- Rule:", row.title);
    }
  } finally {
    await pool.end();
  }
}
run();
