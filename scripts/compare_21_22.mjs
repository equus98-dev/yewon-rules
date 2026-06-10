import { execSync } from 'child_process';

const sqlArticle21 = `SELECT a.contentJson FROM Article a JOIN Revision rev ON a.revisionId = rev.id WHERE rev.ruleId = 'c7fe3367-fe48-4718-a2e5-ebbad103223c' AND a.articleNumber = '21';`;
const sqlArticle22 = `SELECT a.contentJson FROM Article a JOIN Revision rev ON a.revisionId = rev.id WHERE rev.ruleId = 'c7fe3367-fe48-4718-a2e5-ebbad103223c' AND a.articleNumber = '22';`;

try {
  const raw21 = execSync(`node node_modules/wrangler/bin/wrangler.js d1 execute yewon-rules-db --remote --command="${sqlArticle21}"`, { encoding: 'utf8' });
  const raw22 = execSync(`node node_modules/wrangler/bin/wrangler.js d1 execute yewon-rules-db --remote --command="${sqlArticle22}"`, { encoding: 'utf8' });
  console.log("Article 21:", raw21);
  console.log("Article 22:", raw22);
} catch (e) {
  console.error("Error:", e.message);
}
