const { execSync } = require('child_process');

try {
  const output = execSync('npx.cmd wrangler d1 execute yewon-rules-db --remote --json --command="SELECT a.id, a.articleNumber, a.title, a.contentText FROM Article a JOIN Revision r ON a.revisionId = r.id WHERE r.ruleId = \'ba1e19c0-9eec-48cc-bd08-a20bc46b5158\' AND r.versionName LIKE \'%2차 일부개정%\' AND (a.articleNumber = 19 OR a.articleNumber >= 8000)"');
  
  const parsed = JSON.parse(output.toString());
  const rows = parsed[0].results;
  for (const r of rows) {
    if (r.articleNumber === 19 || r.articleNumber >= 8046) {
      console.log('ID:', r.id);
      console.log('Number:', r.articleNumber);
      console.log('Title:', r.title);
      console.log('Content:\n' + r.contentText);
      console.log('---');
    }
  }
} catch (e) {
  console.error('Error:', e.message);
}
