const { execSync } = require('child_process');

try {
  let query = `SELECT currentRevisionId FROM Rule WHERE id = '51fcafb2-6edd-44ec-af43-7bda6d23e35e';`;
  let result = execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --command="${query}" --json`, { encoding: 'utf-8' });
  const revId = JSON.parse(result)[0].results[0].currentRevisionId;
  console.log("Current Revision:", revId);

  query = `SELECT id, contentHtml, contentText FROM Article WHERE revisionId = '${revId}' AND articleNumber = 1;`;
  result = execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --command="${query}" --json`, { encoding: 'utf-8' });
  const article = JSON.parse(result)[0].results[0];
  console.log("Article:", JSON.stringify(article, null, 2));

  const text = article.contentText;
  for(let i=0; i<text.length; i++) {
    console.log(`Char ${i}: ${text[i]} (${text.charCodeAt(i)})`);
    if (i > 40) break;
  }
} catch (e) {
  console.error(e);
}
