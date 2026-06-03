import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const allArts = await pool.query(`
    SELECT r.id as "ruleId", r.title as "ruleTitle", a."articleNumber", a.title, a."contentJson"
    FROM "Article" a
    JOIN "Revision" rv ON a."revisionId" = rv.id
    JOIN "Rule" r ON rv."ruleId" = r.id
  `);
  
  // Rule별로 가지고 있는 articleNumber 목록 수집
  const ruleMap = {};
  for (const row of allArts.rows) {
    if (!ruleMap[row.ruleTitle]) {
      ruleMap[row.ruleTitle] = new Set();
    }
    ruleMap[row.ruleTitle].add(row.articleNumber);
  }
  
  // 의N 조항(예: 의2)이 있는데, 원래 조항이 없는 경우 찾기
  const missingBaseArticles = [];
  
  for (const row of allArts.rows) {
    const isSubArticle = row.title.startsWith('의') || row.title.match(/^\d+\(/);
    // 의N 조항인 경우
    if (isSubArticle) {
       // base article이 있는지 확인. 
       // 예를 들어 제12조의2면 articleNumber는 12.
       // 만약 이 Rule에 "제12조" (즉 subArticle이 아닌 12)가 없다면 누락된 것.
       // (현재 DB에 articleNumber=12인 레코드가 1개뿐이라면 그건 의N 조항이고 본 조항은 없는 것)
    }
  }
  
  const rulesWithMissing = {};
  for (const [ruleTitle, numbers] of Object.entries(ruleMap)) {
    // DB 쿼리를 다시 해서 각 articleNumber에 대해 "의N이 아닌 본조항"이 있는지 확인
  }
  
  const missingQuery = await pool.query(`
    SELECT r.title as "ruleTitle", rv.id as "revId", a."articleNumber", a.title
    FROM "Article" a
    JOIN "Revision" rv ON a."revisionId" = rv.id
    JOIN "Rule" r ON rv."ruleId" = r.id
  `);
  
  const articleMap = {};
  for (const row of missingQuery.rows) {
    const key = row.revId + '_' + row.articleNumber;
    if (!articleMap[key]) articleMap[key] = [];
    articleMap[key].push(row.title);
  }
  
  console.log('=== 누락된 본조항 목록 ===');
  for (const [key, titles] of Object.entries(articleMap)) {
    // titles 배열에 "의N" 형태의 제목이 있는데, 
    // "의"가 안붙은 정상 제목(본조항)이 하나도 없다면 누락된 것
    const hasSub = titles.some(t => t.startsWith('의') || /^\d+\(/.test(t));
    const hasBase = titles.some(t => !t.startsWith('의') && !/^\d+\(/.test(t));
    
    if (hasSub && !hasBase) {
      console.log(`Missing base article in rev ${key.split('_')[0]}, articleNumber: ${key.split('_')[1]}`);
      console.log(`  Existing sub-articles: ${titles.join(', ')}`);
    }
  }

} catch (e) {
  console.error(e.message);
} finally {
  await pool.end();
}
