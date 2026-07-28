const { execSync } = require('child_process');
const fs = require('fs');

async function main() {
  console.log('Fetching Rule ID...');
  const ruleIdStr = execSync('npx wrangler d1 execute yewon-rules-db --remote --command="SELECT id FROM Rule WHERE title LIKE \'%직제%\'" --json', { encoding: 'utf8' });
  const ruleIdParsed = JSON.parse(ruleIdStr);
  if (!ruleIdParsed || !ruleIdParsed[0] || !ruleIdParsed[0].results || ruleIdParsed[0].results.length === 0) {
     console.log("Rule not found");
     return;
  }
  const ruleId = ruleIdParsed[0].results[0].id;
  
  console.log(`Rule ID: ${ruleId}, fetching Revision ID...`);
  const revStr = execSync(`npx wrangler d1 execute yewon-rules-db --remote --command="SELECT id FROM Revision WHERE ruleId = '${ruleId}'" --json`, { encoding: 'utf8' });
  const revParsed = JSON.parse(revStr);
  const revId = revParsed[0].results[0].id;

  console.log(`Revision ID: ${revId}, fetching Articles...`);
  const articlesStr = execSync(`npx wrangler d1 execute yewon-rules-db --remote --command="SELECT id, articleNumber, title, contentText, sortOrder FROM Article WHERE revisionId = '${revId}' ORDER BY sortOrder" --json`, { encoding: 'utf8' });
  const articlesParsed = JSON.parse(articlesStr);
  let articles = articlesParsed[0].results;

  let out = `Total: ${articles.length}\n`;
  articles.forEach(a => {
    let content = a.contentText ? a.contentText.replace(/\\n/g, '\n') : '';
    out += `[ID:${a.id} Num:${a.articleNumber} Order:${a.sortOrder}] ${a.title}\n${content}\n-----------------------------------\n`;
  });
  fs.writeFileSync('dump_rules.txt', out, 'utf-8');
  console.log('Dump complete to dump_rules.txt');
}

main();
