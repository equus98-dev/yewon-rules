const { execSync } = require('child_process');

try {
  const out = execSync('npx wrangler d1 execute yewon-rules-db --remote --command="SELECT a.id, a.title, a.contentText FROM Article a JOIN Revision rev ON a.revisionId = rev.id WHERE rev.ruleId = \'ca9a7cfb-a033-4ac8-8e92-cae76182f363\' AND a.title LIKE \'%제2장%\'"', { encoding: 'utf-8' });
  console.log('D1 Output:', out);
} catch (e) {
  console.log('Error:', e.message);
}
