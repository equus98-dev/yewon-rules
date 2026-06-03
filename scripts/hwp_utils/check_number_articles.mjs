import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const allArts = await pool.query(`
    SELECT a.id, a."articleNumber", a.title, a."contentJson", r.title as "ruleTitle"
    FROM "Article" a
    JOIN "Revision" rv ON a."revisionId" = rv.id
    JOIN "Rule" r ON rv."ruleId" = r.id
  `);
  
  console.log('=== 의N 패턴이 아닌 숫자(제목) 패턴 찾기 ===');
  for (const row of allArts.rows) {
    if (!Array.isArray(row.contentJson)) continue;
    
    // 조항 병합이 안된 케이스 (contentJson의 text가 "숫자(" 나 " 숫자("로 시작)
    const firstItem = row.contentJson[0];
    if (firstItem && firstItem.type === 'article' && firstItem.text) {
      const match = firstItem.text.match(/^\s*(\d+)\s*\((.*?)\)/);
      if (match) {
        console.log(`[${row.ruleTitle}] articleNumber: ${row.articleNumber}`);
        console.log(`  num: "${firstItem.num}"`);
        console.log(`  text: "${firstItem.text.slice(0, 80)}"`);
      }
    }
  }

} catch (e) {
  console.error(e.message);
} finally {
  await pool.end();
}
