const { execSync } = require('child_process');

try {
  const out = execSync('npx wrangler d1 execute yewon-rules-db --remote --command="SELECT id, title, contentText FROM Article WHERE contentText LIKE \'%2020년 3월 1일부터 시행한다%\'"', { encoding: 'utf-8' });
  console.log('D1 Output:', out);
} catch (e) {
  console.log('Error:', e.message);
}
