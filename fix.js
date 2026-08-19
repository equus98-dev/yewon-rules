const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');

async function checkLocalDB() {
  const dbPath = 'dev.db';
  if (fs.existsSync(dbPath)) {
    const db = new DatabaseSync(dbPath);
    try {
      const rules = db.prepare(`SELECT id, title, ruleNumber FROM Rule WHERE ruleNumber = '3-5-10'`).all();
      console.log("RULES in dev.db:", rules);
      if (rules.length > 0) {
        const ruleId = rules[0].id;
        const revisions = db.prepare(`SELECT id, version, versionName FROM Revision WHERE ruleId = ?`, [ruleId]).all();
        console.log("REVISIONS:", revisions);
        if (revisions.length > 0) {
          const revId = revisions[0].id;
          const articles = db.prepare(`SELECT id, articleNumber, title, contentText, sortOrder FROM Article WHERE revisionId = ? ORDER BY sortOrder ASC`, [revId]).all();
          console.log("ARTICLES:", JSON.stringify(articles, null, 2));
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
}
checkLocalDB();
