const db = require('better-sqlite3')('dev.db');
const rows = db.prepare(`SELECT * FROM Article WHERE contentJson LIKE '%학부(과) 장%' OR title LIKE '%학부(과) 장%' OR contentJson LIKE '%학부(과)장%' LIMIT 10`).all();
console.log(JSON.stringify(rows, null, 2));
