const db = require('better-sqlite3')('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/3f0d7354033b57c6e770914eb671715dd9e9a1047e83797474477a6baeecbb43.sqlite');

const rule = db.prepare("SELECT * FROM Rule WHERE title LIKE '%정관%'").get();
if (rule) {
  console.log("Found rule:", rule.title);
  const addenda = db.prepare("SELECT * FROM Addendum WHERE ruleId = ?").all(rule.id);
  console.log("Addenda count:", addenda.length);
  for (const a of addenda) {
    console.log(`\n--- Addendum ${a.id} ---`);
    console.log(a.content);
  }
} else {
  console.log("Rule not found.");
}
