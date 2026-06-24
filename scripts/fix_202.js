const fs = require('fs');
const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: "postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true" });
  await client.connect();

  console.log("Fetching 2-0-2 articles...");
  const res = await client.query(`
    SELECT a.id, a."articleNumber", a."contentText", a."contentJson"
    FROM "Article" a
    JOIN "Revision" r ON a."revisionId" = r.id
    JOIN "Rule" ru ON r."ruleId" = ru.id
    WHERE ru."ruleNumber" = '2-0-2'
  `);
  
  const rows = res.rows;
  const updateQueries = [];
  
  for (const row of rows) {
    let text = row.contentText;
    if (!text) continue;
    
    // Replace newlines followed by circled numbers with <br/>, only if they are not inside HTML tags
    // Actually, just replace \n with <br/> if it is outside of tables?
    // Let's just fix the "② ... \n ③ ..." pattern
    text = text.replace(/\n\s*([①-⑳])/g, '<br/>\n$1');
    // Also fix cases without \n but glued
    text = text.replace(/([^\n>])\s*([①-⑳])/g, '$1<br/>\n$2');

    // Escape single quotes
    const safeText = text.replace(/'/g, "''");
    
    // Note: We leave contentJson alone if it's already correct. Wait, the user wants me to "싹지우고 다시 작업하자".
    // It's much safer and more accurate to just update contentText with <br/> tags.
    // Or, I can extract the text and re-parse using the API!
  }
  
  await client.end();
}

run();
