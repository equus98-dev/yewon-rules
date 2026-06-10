import { execSync } from 'child_process';

const sql1 = `SELECT a.id, a.articleNumber, a.title, a.contentJson FROM Article a JOIN Revision rev ON a.revisionId = rev.id WHERE rev.ruleId = 'c7fe3367-fe48-4718-a2e5-ebbad103223c' AND a.articleNumber = '22';`;
const raw1 = execSync(
  `node node_modules/wrangler/bin/wrangler.js d1 execute yewon-rules-db --remote --command="${sql1}"`,
  { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
);

const jsonStart = raw1.indexOf('[');
const jsonEnd = raw1.lastIndexOf(']') + 1;
const parsed = JSON.parse(raw1.slice(jsonStart, jsonEnd));
const results = parsed[0].results;

for (const r of results) {
  console.log(`\n=== Article #${r.articleNumber}: ${r.title} (id: ${r.id}) ===`);
  console.log(JSON.stringify(r.contentJson, null, 2));
}
