const Database = require('better-sqlite3');
const fs = require('fs');
const db = new Database('dev.db');
const rows = db.prepare(`SELECT title, contentText FROM Article WHERE title LIKE '%부칙%' LIMIT 20`).all();
fs.writeFileSync('scratch/test_db.json', JSON.stringify(rows, null, 2));
