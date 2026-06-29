const db = require('better-sqlite3')('dev.db');
const ruleRows = db.prepare(`SELECT * FROM Rule WHERE title LIKE '%IR%'`).all();
const revRows = db.prepare(`SELECT * FROM Revision WHERE id = 'b58806fa-9ea3-4c43-9a6a-1e946cbe0703'`).all();
console.log("Rule:", JSON.stringify(ruleRows, null, 2));
console.log("Revision:", JSON.stringify(revRows, null, 2));
