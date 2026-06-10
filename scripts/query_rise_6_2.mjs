import { execSync } from 'child_process';

const sqlArticle = `SELECT a.id, a.articleNumber, a.title, a.contentJson FROM Article a JOIN Revision rev ON a.revisionId = rev.id WHERE rev.ruleId = '7b1bfd7a-13e8-4075-a249-7c008bb707b1' AND a.articleNumber = '6';`;

try {
  const raw2 = execSync(
    `node node_modules/wrangler/bin/wrangler.js d1 execute yewon-rules-db --remote --command="${sqlArticle}"`,
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );
  const jsonStart = raw2.indexOf('[');
  const jsonEnd = raw2.lastIndexOf(']') + 1;
  const parsed = JSON.parse(raw2.slice(jsonStart, jsonEnd));
  console.log("RISE Article 6 JSON:", JSON.stringify(parsed[0].results[0].contentJson, null, 2));
} catch (e) {
  console.error("Error article:", e.message);
}
