const { execSync } = require('child_process');

try {
  const out = execSync('npx wrangler d1 execute yewon-rules-db --remote --command="SELECT id, title, contentText, contentHtml, \"articleNumber\" FROM Article WHERE contentHtml LIKE \'%감사종류%\' OR contentText LIKE \'%감사종류%\'"', { encoding: 'utf-8' });
  console.log('D1 Output:', out);
} catch (e) {
  console.log('Error:', e.message);
}
