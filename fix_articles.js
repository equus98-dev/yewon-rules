const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
});

async function main() {
  try {
    const rawData = fs.readFileSync('pg_articles.json', 'utf8');
    const articles = JSON.parse(rawData);
    
    for (const article of articles) {
      let changed = false;
      
      let textStr = article.contentText;
      let jsonStr = JSON.stringify(article.contentJson);
      
      // Fixes
      const replacements = [
        { from: /＜삭제 2026.02.24＞/g, to: '<삭제 2026.02.24.>' },
        { from: /<삭제 2026.02.24＞/g, to: '<삭제 2026.02.24.>' },
        { from: /<삭제 2026.02.24\\n/g, to: '<삭제 2026.02.24.>\n' },
        { from: /<삭제 2026.02.24"/g, to: '<삭제 2026.02.24.>"' }, // for JSON end of string
        { from: /<개정2026.02.24>/g, to: '<개정 2026.02.24>' },
        { from: /재 입실 할 수 있다,<신설 2026.02.24>/g, to: '재 입실 할 수 있다.<신설 2026.02.24>' }
      ];

      for (const r of replacements) {
        if (textStr.match(r.from)) {
          textStr = textStr.replace(r.from, r.to);
          changed = true;
        }
        if (jsonStr.match(r.from)) {
          jsonStr = jsonStr.replace(r.from, r.to);
          changed = true;
        }
      }

      if (changed) {
        console.log(`Updating Article ${article.articleNumber}`);
        await pool.query(
          `UPDATE "Article" SET "contentText" = $1, "contentJson" = $2 WHERE id = $3`,
          [textStr, jsonStr, article.id]
        );
      }
    }
    
    console.log("Done updating articles.");
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
