const { execSync } = require('child_process');

try {
  const out = execSync('npx wrangler d1 execute yewon-rules-db --remote --command="SELECT id, title FROM Attachment WHERE title LIKE \'%감사%\'"', { encoding: 'utf-8' });
  console.log('D1 Output:', out);
} catch (e) {
  console.log('Error:', e.message);
}
