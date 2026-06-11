const { execSync } = require('child_process');

try {
  const out = execSync('npx wrangler d1 execute yewon-rules-db --remote --command="SELECT contentText, contentHtml FROM Article WHERE id = \'a62d11f1-29a9-4137-a404-c03b505b1b29\'"', { encoding: 'utf-8' });
  console.log('D1 Output:', out);
} catch (e) {
  console.log('Error:', e.message);
}
