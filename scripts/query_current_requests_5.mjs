import { execSync } from 'child_process';

const sqlAllArticles = `SELECT a.id, a.title, a.articleNumber FROM Article a JOIN Revision rev ON a.revisionId = rev.id WHERE rev.ruleId = 'c7fe3367-fe48-4718-a2e5-ebbad103223c' AND (a.title LIKE '%22%' OR a.articleNumber = 22) ORDER BY a."sortOrder" ASC;`;

try {
  console.log("Game Rule 22:", execSync(`node node_modules/wrangler/bin/wrangler.js d1 execute yewon-rules-db --remote --command="${sqlAllArticles.replace(/"/g, '\\"')}"`, { encoding: 'utf8' }));
} catch (e) {
  console.error("Error:", e.message);
}
