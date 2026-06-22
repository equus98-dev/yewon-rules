const fs = require('fs');

async function main() {
  try {
    const rawData = fs.readFileSync('pg_articles.json', 'utf8');
    const articles = JSON.parse(rawData);
    
    let sql = '';
    let count = 0;

    for (const article of articles) {
      let changed = false;
      
      let textStr = article.contentText;
      let jsonStr = JSON.stringify(article.contentJson);
      
      const replacements = [
        { from: /＜삭제 2026.02.24＞/g, to: '<삭제 2026.02.24.>' },
        { from: /<삭제 2026.02.24＞/g, to: '<삭제 2026.02.24.>' },
        { from: /<삭제 2026.02.24\\n/g, to: '<삭제 2026.02.24.>\n' },
        { from: /<삭제 2026.02.24"/g, to: '<삭제 2026.02.24.>"' },
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
        // Escape single quotes for SQL
        const escapedTextStr = textStr.replace(/'/g, "''");
        const escapedJsonStr = jsonStr.replace(/'/g, "''");
        
        sql += `UPDATE "Article" SET "contentText" = '${escapedTextStr}', "contentJson" = '${escapedJsonStr}' WHERE id = '${article.id}';\n`;
        count++;
      }
    }
    
    fs.writeFileSync('update_d1.sql', sql, 'utf8');
    console.log(`Generated SQL with ${count} updates.`);
  } catch (err) {
    console.error(err);
  }
}

main();
