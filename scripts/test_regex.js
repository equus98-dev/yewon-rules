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

  console.log("16:", fullText.includes('제16조(학생생활관)'));
  console.log("17:", fullText.includes('제17조(국제교류협력단)'));
  console.log("18:", fullText.includes('제18조(평생교육원)'));
  console.log("19:", fullText.includes('제19조(게임교육센터)'));
  console.log("20:", fullText.includes('제20조(원격평생교육원)'));
  console.log("21:", fullText.includes('제21조(문화예술교육원)'));
  
} catch (e) {
  console.error(e);
}
