const { execSync } = require('child_process');
try {
  const query = `SELECT a.id, a.title, a.fileUrl, a.fileType FROM Attachment a JOIN Rule r ON a.ruleId = r.id WHERE r.ruleNumber = '1-0-1';`;
  const result = execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --command="${query}" --json`, { encoding: 'utf-8' });
  console.log(JSON.stringify(JSON.parse(result), null, 2));
} catch (e) {
  console.error(e);
}
