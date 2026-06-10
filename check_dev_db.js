const db = require('better-sqlite3')('dev.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Tables:", tables);
if (tables.some(t => t.name === 'rules')) {
  const rules = db.prepare("SELECT * FROM rules WHERE title LIKE '%정관%'").all();
  console.log("Rules found:", rules.length);
}
if (tables.some(t => t.name === 'Rule')) {
  const rules = db.prepare("SELECT * FROM Rule WHERE title LIKE '%정관%'").all();
  console.log("Rule found:", rules.length);
  if (rules.length > 0) {
    const addenda = db.prepare("SELECT * FROM Addendum WHERE ruleId = ?").all(rules[0].id);
    for (const a of addenda) {
       console.log(`Addendum: ${a.id}`);
       console.log(a.content);
    }
  }
}
