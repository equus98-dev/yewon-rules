const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function main() {
  const client = await pool.connect();
  try {
    const targetIds = ['5bb11260-f4ee-4ef6-8c45-b63c23f97fb2', '0212d49c-123b-48a9-9f85-fad2e240c943'];
    console.log("Checking ArticleComparison columns before starting transaction...");
    const cols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'ArticleComparison'`);
    console.log("ArticleComparison columns:", cols.rows.map(r => r.column_name));
    const cmpCol = cols.rows.find(r => r.column_name.includes('ArticleId') || r.column_name.includes('articleId'))?.column_name;

    await client.query('BEGIN');
    console.log("Starting deletion transaction for rules 3-5-4-1 and 3-5-5-1...");

    if (cmpCol) {
      const cmpRes = await client.query(`
        DELETE FROM "ArticleComparison" 
        WHERE "${cmpCol}" IN (SELECT id FROM "Article" WHERE "revisionId" IN (SELECT id FROM "Revision" WHERE "ruleId" = ANY($1)))
      `, [targetIds]);
      console.log(`Deleted ArticleComparison count:`, cmpRes.rowCount);
    }

    // 2. Article 삭제
    const artRes = await client.query(`
      DELETE FROM "Article" 
      WHERE "revisionId" IN (SELECT id FROM "Revision" WHERE "ruleId" = ANY($1))
    `, [targetIds]);
    console.log(`Deleted Article count:`, artRes.rowCount);

    // 3. Attachment 삭제
    const attRes = await client.query(`
      DELETE FROM "Attachment" 
      WHERE "ruleId" = ANY($1)
    `, [targetIds]);
    console.log(`Deleted Attachment count:`, attRes.rowCount);

    // 4. Revision 삭제
    const revRes = await client.query(`
      DELETE FROM "Revision" 
      WHERE "ruleId" = ANY($1)
    `, [targetIds]);
    console.log(`Deleted Revision count:`, revRes.rowCount);

    // 5. Rule 삭제
    const ruleRes = await client.query(`
      DELETE FROM "Rule" 
      WHERE id = ANY($1)
    `, [targetIds]);
    console.log(`Deleted Rule count:`, ruleRes.rowCount);

    await client.query('COMMIT');
    console.log("Transaction COMMIT successful. Both rules successfully deleted.");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error occurred, transaction ROLLBACK:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
