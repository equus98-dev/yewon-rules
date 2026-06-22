const { execSync } = require('child_process');
const query = `SELECT a.id, a.articleNumber, a.title, a.contentJson, a.contentText FROM Article a JOIN Revision r ON a.revisionId = r.id JOIN Rule ru ON r.ruleId = ru.id WHERE ru.ruleNumber = '2-0-2' AND a.articleNumber = 17`;
const result = execSync(`npx wrangler d1 execute yewon-rules-db --remote --command "${query}" --json`);
const str = result.toString();
// extract json array from output (sometimes wrangler prints extra lines before json)
const match = str.match(/\[\s*\{[\s\S]*\}\s*\]/);
if (match) {
  console.log(match[0]);
} else {
  console.log(str);
}
