const db = require('better-sqlite3')('dev.db');
const rows = db.prepare("SELECT id, articleNumber, title, contentJson FROM Article WHERE contentJson LIKE '%학부(과) 장%' LIMIT 1").get();
console.log(JSON.stringify(rows, null, 2));