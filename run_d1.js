const { execSync } = require('child_process');

try {
  const result = execSync('npx wrangler d1 execute yewon-rules-db --remote --command="PRAGMA table_info(\'Article\');"', { stdio: 'pipe', encoding: 'utf-8' });
  console.log(result);
} catch(e) {
  console.error(e.stderr);
}
