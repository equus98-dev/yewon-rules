const { execSync } = require('child_process');

try {
  const out = execSync('npx wrangler d1 execute yewon-rules-db --remote --command="SELECT a.id, a.title, a.\"articleNumber\", a.contentHtml FROM Article a JOIN Revision rev ON a.revisionId = rev.id WHERE rev.ruleId = \'f2d6fa0c-ea7e-4a89-b72b-e991017e0b28\' ORDER BY a.\"articleNumber\" DESC LIMIT 10"', { encoding: 'utf-8' });
  console.log('D1 Output:', out);
} catch (e) {
  console.log('Error:', e.message);
}
