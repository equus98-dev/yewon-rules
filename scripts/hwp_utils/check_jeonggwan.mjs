import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const res = await pool.query(`
    SELECT a."articleNumber", a.title, a."sortOrder", a."contentJson"
    FROM "Article" a
    JOIN "Revision" rv ON a."revisionId" = rv.id
    JOIN "Rule" r ON rv."ruleId" = r.id
    WHERE r.title = '학교법인 예원예술대학교 정관'
      AND a."articleNumber" IN (11, 12, 13, 14)
    ORDER BY a."sortOrder"
  `);
  
  console.log('=== 학교법인 예원예술대학교 정관 제11~14조 ===');
  res.rows.forEach(r => {
    console.log(`\nArticle ID: (hidden), articleNumber: ${r.articleNumber}, title: ${r.title}, sortOrder: ${r.sortOrder}`);
    if (Array.isArray(r.contentJson)) {
      r.contentJson.forEach((item, idx) => {
        console.log(`  [${item.type}] num="${item.num}" | text="${item.text?.slice(0, 80)}"`);
      });
    } else {
      console.log('  contentJson is not an array:', r.contentJson);
    }
  });

  // 혹시 제12조, 제12조의2 등이 분리되어 있는지 전체 조항 번호 확인
  const allNums = await pool.query(`
    SELECT a."articleNumber", a.title
    FROM "Article" a
    JOIN "Revision" rv ON a."revisionId" = rv.id
    JOIN "Rule" r ON rv."ruleId" = r.id
    WHERE r.title = '학교법인 예원예술대학교 정관'
    ORDER BY a."sortOrder"
  `);
  console.log('\n=== 전체 articleNumber 목록 ===');
  console.log(allNums.rows.map(r => `${r.articleNumber}(${r.title})`).join(', '));
  
} catch (e) {
  console.error(e.message);
} finally {
  await pool.end();
}
