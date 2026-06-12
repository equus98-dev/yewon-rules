const { execSync } = require('child_process');

function runQuery(query) {
  const result = execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --command="${query}" --json`, { encoding: 'utf-8' });
  return JSON.parse(result)[0].results;
}

try {
  const revs = runQuery(`SELECT id FROM Revision WHERE ruleId IN (SELECT id FROM Rule WHERE title LIKE '%사무분장%') ORDER BY createdAt DESC LIMIT 1;`);
  const revId = revs[0].id;
  const articles = runQuery(`SELECT * FROM Article WHERE articleNumber = 15 AND revisionId = '${revId}';`);
  const fullText = articles[0].contentText;

  const idx = fullText.indexOf("16조");
  console.log("Found at:", idx);
  if (idx !== -1) {
    console.log(fullText.substring(idx - 10, idx + 20));
  }
} catch (e) {
  console.error(e);
}
