const fs = require('fs');
const { Client } = require('pg');
const data = require('../docs/202_db_dump.json');

async function run() {
  const client = new Client({ connectionString: "postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true" });
  await client.connect();

  for (const article of data) {
    let contentText = article.contentText;
    if (!contentText) continue;

    // Clean up weird HTML spacing
    contentText = contentText.replace(/&nbsp;/g, ' ');
    // Remove consecutive newlines
    contentText = contentText.replace(/\n{3,}/g, '\n\n');
    
    // Add br to circled numbers if glued
    contentText = contentText.replace(/\n\s*([①-⑳])/g, '<br/>\n$1');
    contentText = contentText.replace(/([^\n>])\s*([①-⑳])/g, '$1<br/>\n$2');

    // Add br before 호 (1. 2. 3.) if glued to text
    contentText = contentText.replace(/([^\n>])\s*(\d{1,2}(?:의\d+)?\.)\s*(?=[^\d])/g, '$1<br/>\n$2 ');

    // Clean up broken span tags without removing valid ones
    // We'll leave the tags alone, but ensure structural integrity
    
    await client.query(`UPDATE "Article" SET "contentText" = $1 WHERE id = $2`, [contentText, article.id]);
    console.log(`Cleaned Article ${article.articleNumber} : ${article.title}`);
  }
  
  await client.end();
  console.log("Finished rebuilding 2-0-2 from db dump.");
}
run();
