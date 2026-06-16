const Database = require('better-sqlite3');
const db = new Database('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/3f0d7354033b57c6e770914eb671715dd9e9a1047e83797474477a6baeecbb43.sqlite');
const row = db.prepare(`SELECT * FROM "Article" WHERE contentText LIKE '%스포츠경영전공 석·박사학위과정%' LIMIT 1`).get();
console.log(JSON.stringify(row, null, 2));
db.close();
