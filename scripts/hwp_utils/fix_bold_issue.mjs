import pg from 'pg';
import { config } from 'dotenv';

config({ path: '.env' });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const res = await client.query(`
      SELECT a.id, r.title as "ruleTitle", a."articleNumber", a."contentJson"
      FROM "Article" a
      JOIN "Revision" rv ON a."revisionId" = rv.id
      JOIN "Rule" r ON rv."ruleId" = r.id
    `);

    let updatedCount = 0;
    for (const row of res.rows) {
      if (!row.contentJson || !Array.isArray(row.contentJson)) continue;
      
      let needsUpdate = false;
      const newJson = JSON.parse(JSON.stringify(row.contentJson));
      
      // Check the first item
      const firstItem = newJson[0];
      if (firstItem && firstItem.type === 'article' && firstItem.num) {
        // match: Group 1 = "제1조(목적)", Group 2 = "이 법인은 ..."
        const match = firstItem.num.match(/^(제\s*\d+\s*조(?:의\s*\d+)?\s*(?:\([^)]+\))?)\s+(.+)/);
        if (match) {
          const properNum = match[1].trim();
          const extractedText = match[2].trim();
          
          firstItem.num = properNum;
          // Prepend extractedText to existing text
          if (firstItem.text) {
            firstItem.text = extractedText + '\n' + firstItem.text;
          } else {
            firstItem.text = extractedText;
          }
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await client.query(`
          UPDATE "Article"
          SET "contentJson" = $1::jsonb
          WHERE id = $2
        `, [JSON.stringify(newJson), row.id]);
        updatedCount++;
        console.log(`[Fixed] ${row.ruleTitle} - 제${row.articleNumber}조: num -> "${newJson[0].num}"`);
      }
    }

    await client.query('COMMIT');
    console.log(`\n완료: 총 ${updatedCount}개 조항의 굵은 글씨 표기 오류(num 분리) 수정 완료!`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('트랜잭션 롤백:', e.message);
  } finally {
    client.release();
  }
} catch (e) {
  console.error(e.message);
} finally {
  await pool.end();
}
