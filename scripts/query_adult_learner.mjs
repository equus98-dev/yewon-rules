import { execSync } from 'child_process';

const sql = `SELECT a.id, a.articleNumber, a.title, substr(a.contentText,1,300) as ct FROM Article a JOIN Revision rev ON a.revisionId = rev.id WHERE rev.ruleId = '3e68dbcb-2050-4dc0-852b-8f0ed1845713' ORDER BY a.articleNumber;`;

const raw = execSync(
  `node node_modules/wrangler/bin/wrangler.js d1 execute yewon-rules-db --remote --command="${sql}"`,
  { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
);

// Parse JSON from wrangler output
const jsonStart = raw.indexOf('[');
const jsonEnd = raw.lastIndexOf(']') + 1;
const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd));
const results = parsed[0].results;

for (const r of results) {
  console.log(`\n=== Article #${r.articleNumber}: ${r.title} (id: ${r.id}) ===`);
  console.log(r.ct);
}
console.log(`\nTotal: ${results.length} articles`);
