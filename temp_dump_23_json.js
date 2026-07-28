const { execSync } = require('child_process');
const fs = require('fs');

async function main() {
  const ruleIdStr = execSync('npx wrangler d1 execute yewon-rules-db --remote --command="SELECT id FROM Rule WHERE title LIKE \'%직제%\'" --json', { encoding: 'utf8' });
  const ruleId = JSON.parse(ruleIdStr)[0].results[0].id;
  
  const articlesStr = execSync(`npx wrangler d1 execute yewon-rules-db --remote --command="SELECT A.id, A.articleNumber, A.title, A.contentText, A.contentJson, A.revisionId, R.version FROM Article A JOIN Revision R ON A.revisionId = R.id WHERE R.ruleId = '${ruleId}' AND A.articleNumber = 23 ORDER BY R.version DESC" --json`, { encoding: 'utf8' });
  const articles = JSON.parse(articlesStr)[0].results;

  let out = `Total 23rd Articles: ${articles.length}\n`;
  articles.forEach(a => {
    let content = a.contentText ? a.contentText.replace(/\\n/g, '\n') : '';
    let json = a.contentJson ? a.contentJson : 'null';
    out += `[RevVersion:${a.version}] [ID:${a.id} Num:${a.articleNumber}] ${a.title}\nTEXT:\n${content}\nJSON:\n${json}\n-----------------------------------\n`;
  });
  fs.writeFileSync('temp_dump_23_json.txt', out, 'utf-8');
  console.log('Dump complete to temp_dump_23_json.txt');
}

main();
