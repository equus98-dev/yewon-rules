const fs = require('fs');
const { execSync } = require('child_process');
fs.writeFileSync('temp.sql', "SELECT id, ruleId, title, contentText FROM Article WHERE title LIKE '%제3조의2%';");
try {
  const out = execSync('npx wrangler d1 execute yewon-rules-db --remote --file temp.sql --json', { encoding: 'utf8', stdio: 'pipe' });
  console.log(out);
} catch(e) {
  console.error("STDOUT:", e.stdout);
  console.error("STDERR:", e.stderr);
}
