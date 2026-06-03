import pg from 'pg';
import { config } from 'dotenv';

config({ path: '.env' });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const res = await pool.query(`
    SELECT a.id, r.title as "ruleTitle", a."articleNumber", a."contentJson"
    FROM "Article" a
    JOIN "Revision" rv ON a."revisionId" = rv.id
    JOIN "Rule" r ON rv."ruleId" = r.id
  `);

  let issueCount = 0;
  for (const row of res.rows) {
    if (!row.contentJson || !Array.isArray(row.contentJson)) continue;
    
    // Check first item
    const firstItem = row.contentJson[0];
    if (firstItem && firstItem.type === 'article' && firstItem.num) {
      // If num is longer than 30 chars or contains '①' or space after the title part
      const match = firstItem.num.match(/^(제\s*\d+\s*조(?:의\s*\d+)?\s*(?:\([^)]+\))?)\s+(.+)/);
      if (match) {
        // It has extra text in num!
        console.log(`[Issue] ${row.ruleTitle} 제${row.articleNumber}조: num="${firstItem.num.substring(0, 50)}..."`);
        issueCount++;
      }
    }
  }
  console.log(`\n총 ${issueCount}개의 조항에서 num 항목 오류 발견.`);

} catch (e) {
  console.error(e.message);
} finally {
  await pool.end();
}
