const Database = require('better-sqlite3');
const db = new Database('dev.db');
console.log(db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='Article'").get());
console.log(db.prepare("SELECT count(*) FROM Article").get());
console.log(db.prepare("SELECT count(*) FROM Article WHERE contentJson IS NOT NULL").get());
db.close();
