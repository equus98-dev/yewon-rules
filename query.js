const sqlite3 = require('sqlite3'); 
const db = new sqlite3.Database('prisma/dev.db'); 
db.get("SELECT contentHtml, contentText FROM Article WHERE articleNumber = 19 AND ruleId = (SELECT id FROM Rule WHERE ruleName = '장학금지급규정') LIMIT 1", (err, row) => console.log(err || row));
