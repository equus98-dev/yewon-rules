const db = require('better-sqlite3')('dev.db');
const rows = db.prepare("SELECT id, articleNumber, contentJson LENGTH FROM Article WHERE contentJson LIKE '%"type":"article","num":"쀜오%"text":"%쀜오%'").all();
console.log(rows.length);