import { execSync } from 'child_process';

const sqlArticle = `SELECT a.id, a.articleNumber, a.title, a.contentJson FROM Article a JOIN Revision rev ON a.revisionId = rev.id WHERE rev.ruleId = 'b0728cce-b118-4712-a1b4-efabecfc6cba' AND a.articleNumber = '6';`;

try {
  const raw2 = execSync(
    `node node_modules/wrangler/bin/wrangler.js d1 execute yewon-rules-db --remote --command="${sqlArticle}"`,
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );
  console.log("Article 6:", raw2);
} catch (e) {
  console.error("Error article:", e.message);
}
