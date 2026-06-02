import { Pool } from "@neondatabase/serverless";

const connectionString = "postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres";

async function verifyDb() {
  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    const rules = await pool.query(`SELECT id, title FROM "Rule"`);
    console.log(`Total rules in DB: ${rules.rowCount}`);
    
    const revisions = await pool.query(`SELECT id, "ruleId" FROM "Revision"`);
    console.log(`Total revisions in DB: ${revisions.rowCount}`);
    
    const articles = await pool.query(`SELECT id, "revisionId" FROM "Article"`);
    console.log(`Total articles in DB: ${articles.rowCount}`);
    
    const attachments = await pool.query(`SELECT id, title, "fileUrl" FROM "Attachment"`);
    console.log(`Total attachments in DB: ${attachments.rowCount}`);
    
    // Find rules with NO revisions
    const rulesNoRevs = await pool.query(`
      SELECT r.title FROM "Rule" r
      LEFT JOIN "Revision" rev ON rev."ruleId" = r.id
      WHERE rev.id IS NULL
    `);
    if (rulesNoRevs.rowCount > 0) console.log("Rules with no revisions:", rulesNoRevs.rows);

    // Find revisions with NO articles
    const revsNoArts = await pool.query(`
      SELECT r.title, rev.version FROM "Rule" r
      JOIN "Revision" rev ON rev."ruleId" = r.id
      LEFT JOIN "Article" a ON a."revisionId" = rev.id
      WHERE a.id IS NULL
    `);
    if (revsNoArts.rowCount > 0) console.log("Revisions with no articles:", revsNoArts.rows.length);
    else console.log("All revisions have articles.");
    
    // Check if attachments fileUrls are broken
    let brokenAttachments = 0;
    for (const att of attachments.rows) {
      if (!att.fileUrl || att.fileUrl === 'undefined' || att.fileUrl === 'null') {
        brokenAttachments++;
      }
    }
    console.log(`Broken attachment URLs: ${brokenAttachments}`);
  } finally {
    await pool.end();
  }
}

verifyDb().catch(console.error);
