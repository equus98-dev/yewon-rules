const { execSync } = require('child_process');

try {
  let query = `SELECT id, contentText FROM Article WHERE articleNumber = 15 AND revisionId IN (SELECT id FROM Revision WHERE ruleId IN (SELECT id FROM Rule WHERE title LIKE '%사무분장%'));`;
  let result = execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --command="${query}" --json`, { encoding: 'utf-8' });
  const text = JSON.parse(result)[0].results[0].contentText;
  console.log(text);
} catch (e) {
  console.error(e);
}
