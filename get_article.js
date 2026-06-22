const fs = require('fs');
const { execSync } = require('child_process');
const query = `SELECT a.id, a.articleNumber, a.title, a.contentJson, a.contentText FROM Article a JOIN Revision r ON a.revisionId = r.id JOIN Rule ru ON r.ruleId = ru.id WHERE ru.ruleNumber = '2-0-2' AND r.id = (SELECT id FROM Revision WHERE ruleId = ru.id ORDER BY createdAt DESC LIMIT 1) AND (a.chapter LIKE '%부칙%' OR a.title LIKE '%부칙%')`;
const result = execSync(`npx wrangler d1 execute yewon-rules-db --remote --command "${query}" --json`, { maxBuffer: 1024 * 1024 * 10 });
const str = result.toString();
const match = str.match(/\[\s*\{[\s\S]*\}\s*\]/);
if (match) {
  fs.writeFileSync('addendum.json', match[0]);
} else {
  fs.writeFileSync('addendum.json', str);
}
