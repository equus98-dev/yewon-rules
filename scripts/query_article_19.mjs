import { execSync } from 'child_process';

const sqlArticle = `SELECT a.id, a.articleNumber, a.title, a.contentJson FROM Article a JOIN Revision rev ON a.revisionId = rev.id WHERE rev.ruleId = 'c7fe3367-fe48-4718-a2e5-ebbad103223c' AND a.articleNumber = '19';`;

try {
  const raw2 = execSync(
    `node node_modules/wrangler/bin/wrangler.js d1 execute yewon-rules-db --remote --command="${sqlArticle}"`,
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );
  console.log("Article 19:", raw2);
} catch (e) {
  console.error("Error article:", e.message);
}
