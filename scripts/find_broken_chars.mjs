import { execSync } from 'child_process';

// Find all articles with broken characters
const sql = `SELECT a.id, a.articleNumber, a.title, a.contentText FROM Article a WHERE a.contentText LIKE '%\uFFFD%';`;

const raw = execSync(
  `node node_modules/wrangler/bin/wrangler.js d1 execute yewon-rules-db --remote --command="${sql}"`,
  { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
);

const jsonStart = raw.indexOf('[');
const jsonEnd = raw.lastIndexOf(']') + 1;
const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd));
const results = parsed[0].results;

console.log(`Total articles with broken chars: ${results.length}\n`);

for (const r of results) {
  // Find all occurrences of broken chars with context
  const text = r.contentText;
  const regex = /.{0,20}\uFFFD+.{0,20}/g;
  let match;
  const contexts = [];
  while ((match = regex.exec(text)) !== null) {
    contexts.push(match[0]);
  }
  console.log(`=== Article #${r.articleNumber}: ${r.title} (id: ${r.id}) ===`);
  for (const ctx of contexts) {
    console.log(`  Context: ...${ctx}...`);
  }
  console.log();
}
