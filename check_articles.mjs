import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  // 교원 징계규정 - 부칙이 어떻게 저장되어 있는지 전체 확인
  const artRes = await pool.query(`
    SELECT a."articleNumber", a.title, a."sortOrder", a."contentJson", a."contentText"
    FROM "Article" a
    JOIN "Revision" rv ON a."revisionId" = rv.id
    JOIN "Rule" r ON rv."ruleId" = r.id
    WHERE r.title = '교원 징계규정'
    ORDER BY a."sortOrder"
  `);
  
  console.log('=== 교원 징계규정 전체 조항 ===');
  artRes.rows.forEach(r => {
    console.log(`\n제${r.articleNumber}조 (${r.title})`);
    if (Array.isArray(r.contentJson)) {
      r.contentJson.forEach(item => {
        console.log(`  [${item.type}] num="${item.num}" | "${item.text?.slice(0, 100)}"`);
      });
    }
  });
  
  // 여러 규정에서 부칙 패턴 찾기
  const allArts = await pool.query(`
    SELECT a."contentJson", r.title as "ruleTitle", a."articleNumber", a.title as "artTitle"
    FROM "Article" a
    JOIN "Revision" rv ON a."revisionId" = rv.id
    JOIN "Rule" r ON rv."ruleId" = r.id
    WHERE r.title IN ('교원 징계규정', '감사규정', '직원인사규정', '대학원 학칙')
    ORDER BY r.title, a."sortOrder"
  `);
  
  console.log('\n\n=== 부칙 패턴 분석 ===');
  let prevRule = '';
  for (const row of allArts.rows) {
    if (row.ruleTitle !== prevRule) {
      console.log(`\n[${row.ruleTitle}]`);
      prevRule = row.ruleTitle;
    }
    if (!Array.isArray(row.contentJson)) continue;
    for (const item of row.contentJson) {
      const text = (item.text || '');
      const num = (item.num || '');
      if (/부칙|시행일|제정|시행/.test(num + text)) {
        console.log(`  제${row.articleNumber}조(${row.artTitle}) [${item.type}] num="${num}" | "${text.slice(0, 80)}"`);
      }
    }
  }
  
  // 별지 관련 Attachment 데이터 상세
  const attachRes = await pool.query(`
    SELECT a.id, a.title, a."fileUrl", a."fileType", r.title as "ruleTitle"
    FROM "Attachment" a
    JOIN "Rule" r ON a."ruleId" = r.id
    WHERE r.title = '교원 징계규정'
  `);
  console.log('\n=== 교원 징계규정 Attachment ===');
  attachRes.rows.forEach(r => console.log(JSON.stringify(r)));
  
  // contentJson에서 별지 패턴 찾기
  const byeoljiRes = await pool.query(`
    SELECT a."contentJson", r.title as "ruleTitle"
    FROM "Article" a
    JOIN "Revision" rv ON a."revisionId" = rv.id
    JOIN "Rule" r ON rv."ruleId" = r.id
    WHERE r.title = '교원 징계규정'
    ORDER BY a."sortOrder"
  `);
  
  console.log('\n=== 교원 징계규정 별지 패턴 in contentJson ===');
  for (const row of byeoljiRes.rows) {
    if (!Array.isArray(row.contentJson)) continue;
    for (const item of row.contentJson) {
      if (/별지|별표|서식/.test(item.num + item.text)) {
        console.log(`  [${item.type}] num="${item.num}" | "${item.text?.slice(0, 100)}"`);
      }
    }
  }
  
} catch (e) {
  console.error(e.message);
} finally {
  await pool.end();
}
