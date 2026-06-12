const { execSync } = require('child_process');

try {
  // Fetch Article ID and contentHtml
  const query = `SELECT a.id, a.contentText, a.contentJson FROM Article a JOIN Revision rev ON a.revisionId = rev.id JOIN Rule r ON rev.ruleId = r.id WHERE a.articleNumber = 5 AND r.title LIKE '%RISE%';`;
  const result = execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --command="${query}" --json`, { encoding: 'utf-8' });
  const data = JSON.parse(result);
  
  const rows = data[0].results;
  if (!rows || rows.length === 0) {
    console.log("Article not found.");
    process.exit(1);
  }
  
  const article = rows[0];
  let text = article.contentText;
  let json = JSON.parse(article.contentJson);
  
  const replaceHtml = (html) => {
    let newHtml = html.replace(/<td([^>]*)>(.*?)실비(.*?)상한액(.*?)만원(.*?)<\/td>/gs, (match, attrs, p1, p2, p3, p4, p5) => {
       if (!attrs.includes('style=')) {
         return `<td${attrs} style="white-space: nowrap;">${p1}실비${p2}상한액${p3}만원${p4}</td>`;
       } else {
         return match.replace('style="', 'style="white-space: nowrap; ');
       }
    });
    newHtml = newHtml.replace(/<td([^>]*)>(.*?)만원(.*?)<\/td>/gs, (match, attrs, p1, p2) => {
        if (!attrs.includes('style=')) {
          return `<td${attrs} style="white-space: nowrap;">${p1}만원${p2}</td>`;
        } else {
          return match.replace('style="', 'style="white-space: nowrap; ');
        }
    });
    newHtml = newHtml.replace(/<th([^>]*)>(.*?)숙박비(.*?)<\/th>/gs, (match, attrs, p1, p2) => {
        if (!attrs.includes('style=')) {
          return `<th${attrs} style="white-space: nowrap;">${p1}숙박비${p2}</th>`;
        } else {
          return match.replace('style="', 'style="white-space: nowrap; ');
        }
    });
    newHtml = newHtml.replace(/<th([^>]*)>(.*?)교통비(.*?)<\/th>/gs, (match, attrs, p1, p2) => {
        if (!attrs.includes('style=')) {
          return `<th${attrs} style="white-space: nowrap;">${p1}교통비${p2}</th>`;
        } else {
          return match.replace('style="', 'style="white-space: nowrap; ');
        }
    });
    return newHtml;
  };
  
  text = replaceHtml(text);
  
  const walkItems = (obj) => {
     if (Array.isArray(obj)) {
        obj.forEach(item => walkItems(item));
     } else if (obj && typeof obj === 'object') {
        if (typeof obj.text === 'string') {
           obj.text = replaceHtml(obj.text);
        }
        Object.values(obj).forEach(val => walkItems(val));
     }
  };
  walkItems(json);
  
  const updateQuery = `UPDATE Article SET contentText = '${text.replace(/'/g, "''")}', contentJson = '${JSON.stringify(json).replace(/'/g, "''")}' WHERE id = '${article.id}';`;
  require('fs').writeFileSync('update.sql', updateQuery);
  execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --file=update.sql`, { stdio: 'inherit' });
  console.log("Update successful");

} catch(e) {
  console.error(e);
}
