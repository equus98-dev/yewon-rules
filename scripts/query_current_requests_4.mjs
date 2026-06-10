import { execSync } from 'child_process';

const sqlAllArticles = `SELECT a.id, a.articleType, a.title, a.articleNumber FROM Article a JOIN Revision rev ON a.revisionId = rev.id WHERE rev.ruleId = 'c7fe3367-fe48-4718-a2e5-ebbad103223c' ORDER BY a."sortOrder" ASC;`;

try {
  console.log("Game Rule All Articles:", execSync(`node node_modules/wrangler/bin/wrangler.js d1 execute yewon-rules-db --remote --command="${sqlAllArticles.replace(/"/g, '\\"')}"`, { encoding: 'utf8' }));
} catch (e) {
  console.error("Error:", e.message);
}
