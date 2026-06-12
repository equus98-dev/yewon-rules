const { execSync } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');

function runQuery(query) {
  const result = execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --command="${query}" --json`, { encoding: 'utf-8' });
  return JSON.parse(result)[0].results;
}

try {
  // Find rule
  const rules = runQuery(`SELECT id, title FROM Rule WHERE title LIKE '%사무분장%';`);
  if (!rules || rules.length === 0) throw new Error("Rule not found");
  const ruleId = rules[0].id;

  const revs = runQuery(`SELECT id FROM Revision WHERE ruleId = '${ruleId}' ORDER BY createdAt DESC LIMIT 1;`);
  if (!revs || revs.length === 0) throw new Error("Revision not found");
  const revId = revs[0].id;
  console.log("Revision ID:", revId);

  // Get Article 15
  const articles = runQuery(`SELECT * FROM Article WHERE articleNumber = 15 AND revisionId = '${revId}';`);
  if (!articles || articles.length === 0) throw new Error("Article 15 not found");
  const a15 = articles[0];
  const fullText = a15.contentText;

  // Split logic
  const regexes = [
    { num: 16, title: "학생생활관", regex: /제16조\(학생생활관\)(.*?)(?=제17조|$)/s },
    { num: 17, title: "국제교류협력단", regex: /제17조\(국제교류협력단\)(.*?)(?=제18조|$)/s },
    { num: 18, title: "평생교육원", regex: /제18조\(평생교육원\)(.*?)(?=제19조|$)/s },
    { num: 19, title: "게임교육센터", regex: /제19조\(게임교육센터\)(.*?)(?=제20조|$)/s },
    { num: 20, title: "원격평생교육원", regex: /제20조\(원격평생교육원\)(.*?)(?=제21조|$)/s },
    { num: 21, title: "문화예술교육원", regex: /제21조\(문화예술교육원\)(.*?)$/s }
  ];

  let currentText = fullText;
  const newArticles = [];

  for (let i = regexes.length - 1; i >= 0; i--) {
    const { num, title, regex } = regexes[i];
    const match = currentText.match(regex);
    if (match) {
      newArticles.unshift({
        num,
        title,
        text: match[0].trim()
      });
      currentText = currentText.replace(match[0], '').trim();
    }
  }

  // currentText is now Article 15
  console.log("Article 15 length:", currentText.length);
  console.log("New Articles:", newArticles.map(a => a.num));

  if (newArticles.length !== 6) {
    console.log("Failed to extract all articles");
    process.exit(1);
  }

  let sqlFileContent = ``;

  // Update Article 15
  const updateQuery = `UPDATE Article SET contentText = '${currentText.replace(/'/g, "''")}' WHERE id = '${a15.id}';\n`;
  sqlFileContent += updateQuery;

  // Insert new articles
  for (const a of newArticles) {
    const newId = crypto.randomUUID();
    const sortOrder = a.num;
    const text = a.text.replace(/'/g, "''");
    
    // Check if it already exists
    const existing = runQuery(`SELECT id FROM Article WHERE articleNumber = ${a.num} AND revisionId = '${revId}';`);
    if (existing.length > 0) {
      console.log(`Article ${a.num} already exists, updating...`);
      sqlFileContent += `UPDATE Article SET contentText = '${text}', chapter = '${a15.chapter}', title = '${a.title}', sortOrder = ${sortOrder} WHERE id = '${existing[0].id}';\n`;
    } else {
      console.log(`Inserting Article ${a.num}...`);
      sqlFileContent += `INSERT INTO Article (id, revisionId, chapter, section, articleNumber, title, contentJson, contentHtml, contentText, sortOrder, createdAt, updatedAt, part, subSection) VALUES ('${newId}', '${revId}', '${a15.chapter}', NULL, ${a.num}, '${a.title}', '{"paragraphs":[]}', NULL, '${text}', ${sortOrder}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, NULL);\n`;
    }
  }
  
  fs.writeFileSync('scripts/fix.sql', sqlFileContent);
  console.log("Wrote SQL to scripts/fix.sql");

  execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --file=scripts/fix.sql`, { stdio: 'inherit' });
  console.log("Done!");
} catch (e) {
  console.error(e);
}
