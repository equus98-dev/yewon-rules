import { execSync } from 'child_process';

const sqlCategories = `SELECT id, name FROM Category WHERE name LIKE '%부속%' OR name LIKE '%부설%';`;
const sqlArticle = `SELECT a.id, a.articleNumber, a.title, a.contentJson FROM Article a JOIN Revision rev ON a.revisionId = rev.id WHERE rev.ruleId = '17c3e889-9c5b-4c94-b827-70dbd7f9df7b' AND a.articleNumber = '49';`;

try {
  const raw1 = execSync(
    `node node_modules/wrangler/bin/wrangler.js d1 execute yewon-rules-db --remote --command="${sqlCategories}"`,
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );
  console.log("Categories:", raw1);
} catch (e) {
  console.error("Error categories:", e.message);
}

try {
  const raw2 = execSync(
    `node node_modules/wrangler/bin/wrangler.js d1 execute yewon-rules-db --remote --command="${sqlArticle}"`,
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );
  console.log("Article:", raw2);
} catch (e) {
  console.error("Error article:", e.message);
}
