const Database = require('better-sqlite3');
const db = new Database('dev.db');

const rules = db.prepare("SELECT id, title FROM Rule WHERE title LIKE '%교육혁신원%'").all();
console.log('Found rules:', rules);

if (rules.length > 0) {
  const revs = db.prepare("SELECT id, version, versionName FROM Revision WHERE ruleId = ? ORDER BY version DESC").all(rules[0].id);
  console.log('Found revisions:', revs);
  
  if (revs.length > 0) {
    const revId = revs[0].id;
    const articles = db.prepare("SELECT id, articleNumber, title, chapter FROM Article WHERE revisionId = ? AND articleNumber = 15").all(revId);
    console.log('Article 15:', articles);
    
    if (articles.length > 0) {
      db.prepare("UPDATE Article SET articleNumber = 8000, title = '부칙', chapter = '' WHERE id = ?").run(articles[0].id);
      console.log('Fixed Article 15 locally');
    }
  }
}
