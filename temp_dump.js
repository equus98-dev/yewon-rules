const { execSync } = require('child_process');  
const fs = require('fs');  
async function main() {  
  const ruleIdStr = execSync('npx wrangler d1 execute yewon-rules-db --remote --command=\" SELECT id FROM Rule WHERE title LIKE  "%%Á÷Á¦%%\ --json', { encoding: 'utf8' });  
  const ruleId = JSON.parse(ruleIdStr)[0].results[0].id;  
