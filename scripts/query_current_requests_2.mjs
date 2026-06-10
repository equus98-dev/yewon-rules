import { execSync } from 'child_process';

const sqlStudent = `SELECT a.id, a.articleNumber, a.title, a.contentText FROM Article a JOIN Revision rev ON a.revisionId = rev.id WHERE rev.ruleId = '17c3e889-9c5b-4c94-b827-70dbd7f9df7b' AND a.articleNumber = '26';`;
const sqlGame22All = `SELECT a.id, a.articleNumber, a.title, a.contentJson FROM Article a JOIN Revision rev ON a.revisionId = rev.id WHERE rev.ruleId = 'c7fe3367-fe48-4718-a2e5-ebbad103223c' AND (a.articleNumber = '22' OR a.title LIKE '%22%');`;

try {
  console.log("Student Rule 26:", execSync(`node node_modules/wrangler/bin/wrangler.js d1 execute yewon-rules-db --remote --command="${sqlStudent}"`, { encoding: 'utf8' }));
  console.log("Game Rule 22 ALL:", execSync(`node node_modules/wrangler/bin/wrangler.js d1 execute yewon-rules-db --remote --command="${sqlGame22All}"`, { encoding: 'utf8' }));
} catch (e) {
  console.error("Error:", e.message);
}
