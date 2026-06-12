const fs = require('fs');
const { execSync } = require('child_process');
const crypto = require('crypto');

function runQuery(query) {
  const result = execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --command="${query}" --json`, { encoding: 'utf-8' });
  return JSON.parse(result)[0].results;
}

try {
  // Read full text from log
  const logContent = fs.readFileSync('C:/Users/윈도우11/.gemini/antigravity/brain/8040ce2f-ed1d-4bc8-850c-539b76fd84ec/.system_generated/tasks/task-692.log', 'utf-8');
  
  // Extract the text between "제15조" and the end of line 21
  const match = logContent.match(/제15조\(정보도서관\).*?<삭제 2019\.1\.23\.>/s);
  if (!match) throw new Error("Could not find full text in log");
  const fullText = match[0];

  // Find rule
  const rules = runQuery(`SELECT id, title FROM Rule WHERE title LIKE '%사무분장%';`);
  if (!rules || rules.length === 0) throw new Error("Rule not found");
  const ruleId = rules[0].id;

  const revs = runQuery(`SELECT id FROM Revision WHERE ruleId = '${ruleId}' ORDER BY createdAt DESC LIMIT 1;`);
  if (!revs || revs.length === 0) throw new Error("Revision not found");
  const revId = revs[0].id;

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
    const m = currentText.match(regex);
    if (m) {
      newArticles.unshift({
        num,
        title,
        text: m[0].trim()
      });
      currentText = currentText.replace(m[0], '').trim();
    }
  }

  console.log("Extracted Articles:", newArticles.map(a => a.num));

  let sqlFileContent = ``;

  // Get Article 15 to get its ID and chapter
  const articles = runQuery(`SELECT id, chapter FROM Article WHERE articleNumber = 15 AND revisionId = '${revId}';`);
  const a15 = articles[0];

  sqlFileContent += `UPDATE Article SET contentText = '${currentText.replace(/'/g, "''")}' WHERE id = '${a15.id}';\n`;

  for (const a of newArticles) {
    const newId = crypto.randomUUID();
    const sortOrder = a.num;
    const text = a.text.replace(/'/g, "''");
    
    // Check if it already exists
    const existing = runQuery(`SELECT id FROM Article WHERE articleNumber = ${a.num} AND revisionId = '${revId}';`);
    if (existing.length > 0) {
      sqlFileContent += `UPDATE Article SET contentText = '${text}', chapter = '${a15.chapter}', title = '${a.title}', sortOrder = ${sortOrder} WHERE id = '${existing[0].id}';\n`;
    } else {
      sqlFileContent += `INSERT INTO Article (id, revisionId, chapter, section, articleNumber, title, contentJson, contentHtml, contentText, sortOrder, createdAt, updatedAt, part, subSection) VALUES ('${newId}', '${revId}', '${a15.chapter}', NULL, ${a.num}, '${a.title}', '{"paragraphs":[]}', NULL, '${text}', ${sortOrder}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, NULL);\n`;
    }
  }
  
  fs.writeFileSync('scripts/fix.sql', sqlFileContent);
  console.log("Wrote SQL to scripts/fix.sql");

  execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --file=scripts/fix.sql`, { stdio: 'inherit' });
  console.log("Database successfully updated!");
} catch (e) {
  console.error(e);
}
