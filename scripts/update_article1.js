const { execSync } = require('child_process');

try {
  const newText = "제1조(목적) 이 규정은 『학교법인 예원예술대학교 정관』 제7장 제2절 및 예원예술대학교(이하 “우리 대학교”라 한다) 『학칙』제3조에 따라 우리 대학교의 직제에 관한 사항을 규정함을 목적으로 한다.";
  
  let query = `UPDATE Article SET contentText = '${newText}' WHERE articleNumber = 1 AND revisionId IN (SELECT id FROM Revision WHERE ruleId = '51fcafb2-6edd-44ec-af43-7bda6d23e35e');`;
  
  let result = execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --command="${query}" --json`, { encoding: 'utf-8' });
  console.log("Update Result:", JSON.stringify(JSON.parse(result), null, 2));
} catch (e) {
  console.error(e);
}
