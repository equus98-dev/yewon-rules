const db = require('better-sqlite3')('dev.db');
const rows = db.prepare("SELECT * FROM Article WHERE contentJson LIKE '%íœ”Á÷ÇÇ ÀçÀ¯%' LIMIT 10").all();
console.log(JSON.stringify(rows, null, 2));