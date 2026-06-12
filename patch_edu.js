const Database = require('better-sqlite3');
const db = new Database('dev.db');

const rules = db.prepare("SELECT id FROM Rule WHERE title LIKE '%교육혁신원 규정%'").all();
if (rules.length > 0) {
  const revs = db.prepare("SELECT id FROM Revision WHERE ruleId = ? ORDER BY version DESC").all(rules[0].id);
  if (revs.length > 0) {
    const articles = db.prepare("SELECT id, articleNumber, title, chapter FROM Article WHERE revisionId = ? AND articleNumber = 15").all(revs[0].id);
    if (articles.length > 0) {
      console.log('Found:', articles[0]);
      db.prepare("UPDATE Article SET articleNumber = 8000, title = '부칙', chapter = '' WHERE id = ?").run(articles[0].id);
      console.log('Fixed Article 15 locally');
    } else {
      console.log('Article 15 not found. Let us check what addendum looks like');
      const allArgs = db.prepare("SELECT id, articleNumber, title, chapter FROM Article WHERE revisionId = ?").all(revs[0].id);
      console.log(allArgs);
    }
  }
}
