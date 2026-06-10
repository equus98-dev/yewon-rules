const db = require('better-sqlite3')('dev.db');
const rules = db.prepare("SELECT * FROM rules WHERE title LIKE '%학교법인 예원예술대학교 정관%'").all();
console.log("RULES:", rules.map(r => r.id));

if (rules.length > 0) {
  const addenda = db.prepare("SELECT * FROM addenda WHERE ruleId = ?").all(rules[0].id);
  console.log("ADDENDA COUNT:", addenda.length);
  console.log(addenda[0]);
  
  // Let's write the addenda to a temp file to see its content easily
  const fs = require('fs');
  fs.writeFileSync('temp_addenda.json', JSON.stringify(addenda, null, 2));
}
