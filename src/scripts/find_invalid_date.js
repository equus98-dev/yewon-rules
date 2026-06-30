const { execSync } = require('child_process');

try {
  const output = execSync('npx.cmd wrangler d1 execute yewon-rules-db --remote --json --command="SELECT r.id, r.title, (SELECT enactmentDate FROM Revision WHERE ruleId = r.id ORDER BY version DESC LIMIT 1) AS enactmentDate FROM Rule r"');
  
  const parsed = JSON.parse(output.toString());
  const rows = parsed[0].results;
  console.log('Total rules:', rows.length);
  for (const r of rows) {
    if (r.enactmentDate) {
      const d = new Date(r.enactmentDate);
      if (isNaN(d.getTime())) {
        console.log('Found invalid date:', r.id, r.title, r.enactmentDate);
      }
    }
  }
} catch (e) {
  console.error('Error:', e.message);
}
