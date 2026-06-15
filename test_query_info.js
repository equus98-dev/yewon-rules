const Database = require('better-sqlite3');
const db = new Database('f:/예원예술대학교_규정관리시스템/dev.db');

const keywords = ['법인', '주소', '규정', '어디', '나와있어'];
console.log("Keywords:", keywords);

let conditions = [];
let params = [];
let scoreCases = [];

for (let i = 0; i < keywords.length; i++) {
  const p = `?`;
  conditions.push(`(a."contentText" LIKE ${p} OR a.title LIKE ${p} OR r.title LIKE ${p})`);
  scoreCases.push(`
    (CASE WHEN r.title LIKE ${p} THEN 5 ELSE 0 END) +
    (CASE WHEN a.title LIKE ${p} THEN 3 ELSE 0 END) +
    (CASE WHEN a."contentText" LIKE ${p} THEN 1 ELSE 0 END)
  `);
  params.push(`%${keywords[i]}%`);
  params.push(`%${keywords[i]}%`);
  params.push(`%${keywords[i]}%`);
  params.push(`%${keywords[i]}%`);
  params.push(`%${keywords[i]}%`);
  params.push(`%${keywords[i]}%`);
}

const sql = `
  SELECT a.title as articleTitle, a."contentText", a.chapter, a.section, r.title as ruleTitle,
         (${scoreCases.join(" + ")}) as relevance
  FROM "Article" a
  JOIN "Revision" rev ON a."revisionId" = rev.id
  JOIN "Rule" r ON rev."ruleId" = r.id
  WHERE ${conditions.map((_, i) => `(a."contentText" LIKE ? OR a.title LIKE ? OR r.title LIKE ?)`).join(" OR ")} 
  ORDER BY relevance DESC
  LIMIT 15
`;

// Build params correctly
let allParams = [];
for (let i = 0; i < keywords.length; i++) {
  // for scoreCases
  allParams.push(`%${keywords[i]}%`);
  allParams.push(`%${keywords[i]}%`);
  allParams.push(`%${keywords[i]}%`);
}
for (let i = 0; i < keywords.length; i++) {
  // for WHERE
  allParams.push(`%${keywords[i]}%`);
  allParams.push(`%${keywords[i]}%`);
  allParams.push(`%${keywords[i]}%`);
}

const stmt = db.prepare(sql);
const results = stmt.all(...allParams);

console.log(`Results: ${results.length}`);
results.forEach(r => {
  console.log(`[${r.ruleTitle}] ${r.articleTitle} (Score: ${r.relevance})`);
  // console.log(`  Content: ${r.contentText.substring(0, 100)}...`);
});
