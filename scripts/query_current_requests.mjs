import { execSync } from 'child_process';

const sqlStudent = `SELECT id, articleNumber, contentText, contentJson FROM Article WHERE title LIKE '%구성%' AND contentText LIKE '%학생회 정.부회장%';`;
const sqlSpecial = `SELECT id, articleNumber, contentText, contentJson FROM Article WHERE title LIKE '%결산서의 작성%';`;
const sqlGame22 = `SELECT a.id, a.articleNumber, a.title, a.contentJson FROM Article a JOIN Revision rev ON a.revisionId = rev.id WHERE rev.ruleId = 'c7fe3367-fe48-4718-a2e5-ebbad103223c' AND a.articleNumber = '22';`;

try {
  console.log("Student Rule:", execSync(`node node_modules/wrangler/bin/wrangler.js d1 execute yewon-rules-db --remote --command="${sqlStudent}"`, { encoding: 'utf8' }));
  console.log("Special Rule:", execSync(`node node_modules/wrangler/bin/wrangler.js d1 execute yewon-rules-db --remote --command="${sqlSpecial}"`, { encoding: 'utf8' }));
  console.log("Game Rule 22:", execSync(`node node_modules/wrangler/bin/wrangler.js d1 execute yewon-rules-db --remote --command="${sqlGame22}"`, { encoding: 'utf8' }));
} catch (e) {
  console.error("Error:", e.message);
}
