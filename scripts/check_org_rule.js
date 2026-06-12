const { execSync } = require('child_process');

try {
  let query = `SELECT id, articleNumber, chapter, section, contentText FROM Article WHERE contentText LIKE '%제7장 제2절%';`;
  let result = execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --command="${query}" --json`, { encoding: 'utf-8' });
  console.log(JSON.stringify(JSON.parse(result)[0].results, null, 2));
} catch (e) {
  console.error(e);
}
