const sqlite3 = require('better-sqlite3');
const db = new sqlite3('dev.db');

const query = `
  SELECT r.title as RuleTitle, r.ruleNumber, a.chapter, a.articleNumber, a.title as ArticleTitle, a.contentText
  FROM Article a
  JOIN Revision rev ON a.revisionId = rev.id
  JOIN Rule r ON rev.ruleId = r.id
  WHERE (a.contentText LIKE '%국제매니지먼트%' OR a.contentText LIKE '%글로벌문화%' OR a.contentText LIKE '%단과대학%')
    AND rev.version = (SELECT MAX(version) FROM Revision WHERE ruleId = r.id)
  ORDER BY r.title, a.articleNumber;
`;

const rows = db.prepare(query).all();
console.log(JSON.stringify(rows, null, 2));
