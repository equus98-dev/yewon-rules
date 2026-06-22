const { execSync } = require('child_process');
const result = execSync('npx wrangler d1 execute yewon-rules-db --remote --json --command "SELECT a.id, a.articleNumber, a.title, a.contentJson, a.contentText FROM Article a JOIN Revision r ON a.revisionId = r.id JOIN Rule ru ON r.ruleId = ru.id WHERE ru.ruleNumber = \'2-0-2\' AND a.title LIKE \'%제17조%\' ORDER BY a.articleNumber ASC LIMIT 1"', { maxBuffer: 10 * 1024 * 1024 }).toString();
console.log(JSON.parse(result)[0].results[0]);
