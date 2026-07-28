const sqlite3 = require('better-sqlite3');
const db = new sqlite3('dev.db');

const rules = db.prepare(`SELECT title, ruleNumber FROM Rule WHERE title LIKE '%직제%' OR title LIKE '%학칙%' OR title LIKE '%교무%'`).all();
console.log("RULES:", rules);

const depts = db.prepare(`SELECT name FROM Department`).all();
console.log("DEPTS:", depts);
