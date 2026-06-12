const { execSync } = require('child_process');

try {
  let query = `SELECT r.id, r.title FROM Rule r WHERE r.title LIKE '%사무분장%';`;
  let result = execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --command="${query}" --json`, { encoding: 'utf-8' });
  const rules = JSON.parse(result)[0].results;
  const ruleId = rules[0].id;
  console.log("Rule:", rules[0].title);
  
  query = `SELECT a.articleNumber, a.title FROM Article a JOIN Revision rev ON a.revisionId = rev.id WHERE rev.ruleId = '${ruleId}' ORDER BY a.sortOrder;`;
  result = execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --command="${query}" --json`, { encoding: 'utf-8' });
  const articles = JSON.parse(result)[0].results;
  console.log("Articles:", articles.map(a => `${a.articleNumber}: ${a.title}`).join(', '));
} catch (e) {
  console.error(e);
}
