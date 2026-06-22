const { execSync } = require('child_process');
const fs = require('fs');
const result = execSync('npx wrangler d1 execute yewon-rules-db --remote --json --command "SELECT a.id, a.articleNumber, a.title, a.contentJson, a.contentText, r.id as revisionId FROM Article a JOIN Revision r ON a.revisionId = r.id JOIN Rule ru ON r.ruleId = ru.id WHERE ru.ruleNumber = \'2-0-2\' AND a.articleNumber >= 8000 ORDER BY a.articleNumber ASC"', { maxBuffer: 10 * 1024 * 1024 }).toString();
fs.writeFileSync('docs/202_addendums_full.json', result);
