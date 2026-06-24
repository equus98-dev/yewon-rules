const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

function findDbFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const fullPath = path.join(dir, f);
    if (fs.statSync(fullPath).isDirectory()) {
      findDbFiles(fullPath, fileList);
    } else if (f.endsWith('.sqlite')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const dbFiles = findDbFiles('.wrangler');
console.log("Found sqlite files:", dbFiles);

for (const dbPath of dbFiles) {
  try {
    const db = new Database(dbPath);
    const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
    console.log(`\n--- Tables in ${dbPath} ---`);
    console.log(tables.map(t => t.name).join(', '));
    
    if (tables.some(t => t.name.toLowerCase() === 'rule')) {
      const ruleTableName = tables.find(t => t.name.toLowerCase() === 'rule').name;
      const rules = db.prepare(`SELECT id, title FROM ${ruleTableName} WHERE title LIKE '%감사%'`).all();
      console.log("Matched Rules:", rules);
      
      const articleTableName = tables.find(t => t.name.toLowerCase() === 'article')?.name;
      if (articleTableName && rules.length > 0) {
        const revTableName = tables.find(t => t.name.toLowerCase() === 'revision')?.name;
        const revs = db.prepare(`SELECT * FROM ${revTableName} WHERE ruleId = ?`).all(rules[0].id);
        if (revs.length > 0) {
          const currentRevId = rules[0].currentRevisionId || revs[revs.length - 1].id;
          const articles = db.prepare(`SELECT * FROM ${articleTableName} WHERE revisionId = ? AND articleNumber = 19`).all(currentRevId);
          console.log("Article 19 Result:", JSON.stringify(articles, null, 2));
        }
      }
    }
  } catch (e) {
    console.log(`Error reading ${dbPath}:`, e.message);
  }
}
