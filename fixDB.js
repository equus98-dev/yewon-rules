const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: "postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const res = await pool.query(`SELECT id, title, "contentText", "contentJson" FROM "Article" WHERE "contentText" LIKE '%[nocite]%' OR "contentText" LIKE '%[/nocite]%' OR title LIKE '%[nocite]%' OR title LIKE '%[/nocite]%' OR "contentJson"::text LIKE '%[nocite]%' OR "contentJson"::text LIKE '%[/nocite]%'`);
    
    console.log(`Found ${res.rowCount} articles with [nocite] tags.`);
    
    for (const row of res.rows) {
      console.log(`\n--- Article ID: ${row.id} ---`);
      console.log(`Title: ${row.title}`);
      
      let newText = row.contentText;
      let newTitle = row.title;
      let newJsonStr = row.contentJson;
      
      if (newText) {
         newText = newText.replace(/\[nocite\]|\[\/nocite\]/gi, '');
      }
      if (newTitle) {
         newTitle = newTitle.replace(/\[nocite\]|\[\/nocite\]/gi, '');
      }
      if (newJsonStr) {
         newJsonStr = newJsonStr.replace(/\[nocite\]|\[\/nocite\]/gi, '');
      }
      
      await pool.query(
        `UPDATE "Article" SET "contentText" = $1, title = $2, "contentJson" = $3 WHERE id = $4`,
        [newText, newTitle, newJsonStr, row.id]
      );
      console.log("Updated article.");
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
