const Database = require('better-sqlite3');
const dbPath = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/3f0d7354033b57c6e770914eb671715dd9e9a1047e83797474477a6baeecbb43.sqlite';
const db = new Database(dbPath);

const rules = db.prepare(`SELECT id, ruleNumber, title FROM Rule WHERE ruleNumber = '1-0-2'`).all();
console.log('Rules:', rules);

if (rules.length > 0) {
  const rule = rules[0];
  const revision = db.prepare('SELECT id, versionName FROM Revision WHERE ruleId = ? ORDER BY version DESC LIMIT 1').get(rule.id);
  console.log('Revision:', revision);

  if (revision) {
    const articles = db.prepare(`SELECT id, articleNumber, title, contentText FROM Article WHERE revisionId = ? AND (title LIKE '%제12조%' OR title LIKE '%제52조%' OR title LIKE '%제53조%') ORDER BY articleNumber`).all(revision.id);
    console.log('Articles:');
    articles.forEach(a => {
      console.log(`- ID: ${a.id}`);
      console.log(`  Number: ${a.articleNumber}`);
      console.log(`  Title: ${a.title}`);
      console.log(`  Text: ${a.contentText}`);
      console.log('---');
    });
  }
}
