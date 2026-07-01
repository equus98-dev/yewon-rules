const Database = require('better-sqlite3');
const fs = require('fs');

const db = new Database('dev.db');
const rows = db.prepare(`
  SELECT a.articleNumber, a.title, a.contentText, a.contentJson 
  FROM Article a
  JOIN Rule r ON a.ruleId = r.id
  WHERE r.ruleNumber = '1-0-1' AND a.title LIKE '%부%'
`).all();

fs.writeFileSync('scratch/test9.json', JSON.stringify(rows, null, 2));
console.log("Dumped 1-0-1 addendums to test9.json");
