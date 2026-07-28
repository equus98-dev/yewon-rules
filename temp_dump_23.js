const { execSync } = require('child_process');
const fs = require('fs');

async function main() {
  const ruleIdStr = execSync('npx wrangler d1 execute yewon-rules-db --remote --command="SELECT id FROM Rule WHERE title LIKE \'%직제%\'" --json', { encoding: 'utf8' });
  const ruleId = JSON.parse(ruleIdStr)[0].results[0].id;
  
  console.log(`Rule ID: ${ruleId}`);
  const articlesStr = execSync(`npx wrangler d1 execute yewon-rules-db --remote --command="SELECT A.id, A.articleNumber, A.title, A.contentText, A.revisionId, R.version FROM Article A JOIN Revision R ON A.revisionId = R.id WHERE R.ruleId = '${ruleId}' ORDER BY R.version DESC, A.sortOrder ASC" --json`, { encoding: 'utf8' });
  const articles = JSON.parse(articlesStr)[0].results;

  let out = `Total Articles across all revisions: ${articles.length}\n`;
  articles.forEach(a => {
    let content = a.contentText ? a.contentText.replace(/\\n/g, '\n') : '';
    if (a.articleNumber === 23) {
      out += `[RevVersion:${a.version}] [ID:${a.id} Num:${a.articleNumber}] ${a.title}\n${content}\n-----------------------------------\n`;
    }
  });
  fs.writeFileSync('temp_dump_23.txt', out, 'utf-8');
  console.log('Dump complete to temp_dump_23.txt');
}

main();
