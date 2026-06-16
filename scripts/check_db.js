const Database = require('better-sqlite3');
const db = new Database('dev.db');
const row = db.prepare(`SELECT * FROM "Article" WHERE contentText LIKE '%스포츠경영전공 석·박사학위과정%' LIMIT 1`).get();
console.log(JSON.stringify(row, null, 2));
db.close();
