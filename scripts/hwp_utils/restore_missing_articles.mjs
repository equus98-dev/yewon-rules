import pg from 'pg';
import { config } from 'dotenv';
import { randomUUID } from 'crypto';
config({ path: '.env' });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const missingArticlesToRestore = [
    {
      ruleTitle: '학교법인 예원예술대학교 정관',
      articleNumber: 12,
      title: '회계년도',
      content: '이 법인의 회계년도는 3월 1일부터 익년 2월 말일까지로 한다.'
    }
  ];

  // 의N 서브조항이 실제로 있는 (subNumber가 1 이상인) articleNumber 찾기
  // 우리는 DB에 "의N(실제제목)" 패턴으로 저장했음.
  const subArtsRes = await pool.query(`
    SELECT r.title as "ruleTitle", rv.id as "revId", a."articleNumber", a.title, a.id, a."sortOrder"
    FROM "Article" a
    JOIN "Revision" rv ON a."revisionId" = rv.id
    JOIN "Rule" r ON rv."ruleId" = r.id
    WHERE a.title LIKE '의%(%'
  `);

  const missingMap = {}; // { revId_articleNumber: { ruleTitle, revId, articleNumber, sortOrderHint } }
  
  for (const row of subArtsRes.rows) {
    // Check if the base article exists
    const baseCheck = await pool.query(`
      SELECT id FROM "Article"
      WHERE "revisionId" = $1 AND "articleNumber" = $2 AND title NOT LIKE '의%(%'
    `, [row.revId, row.articleNumber]);
    
    if (baseCheck.rowCount === 0) {
      const key = `${row.revId}_${row.articleNumber}`;
      if (!missingMap[key]) {
        missingMap[key] = {
          ruleTitle: row.ruleTitle,
          revId: row.revId,
          articleNumber: row.articleNumber,
          sortOrderHint: row.sortOrder // We will insert the base article right before this
        };
      } else {
        if (row.sortOrder < missingMap[key].sortOrderHint) {
          missingMap[key].sortOrderHint = row.sortOrder;
        }
      }
    }
  }

  console.log(`복구 대상 본조항 수: ${Object.keys(missingMap).length}`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let count = 0;

    for (const [key, data] of Object.entries(missingMap)) {
      console.log(`복구 중: [${data.ruleTitle}] 제${data.articleNumber}조`);
      
      // Known data from user
      let titleToRestore = `제${data.articleNumber}조`;
      let textToRestore = '(시스템 오류로 조항 본문이 유실되었습니다. 관리자 페이지에서 재입력 바랍니다.)';

      const known = missingArticlesToRestore.find(x => x.ruleTitle === data.ruleTitle && x.articleNumber === data.articleNumber);
      if (known) {
        titleToRestore = known.title;
        textToRestore = known.content;
      }
      
      const numLabel = `제${data.articleNumber}조(${titleToRestore})`;
      const contentJson = [
        {
          type: 'article',
          num: numLabel,
          text: textToRestore
        }
      ];

      // Shift sortOrder for all articles >= sortOrderHint
      await client.query(`
        UPDATE "Article"
        SET "sortOrder" = "sortOrder" + 1
        WHERE "revisionId" = $1 AND "sortOrder" >= $2
      `, [data.revId, data.sortOrderHint]);

      const now = new Date().toISOString();
      await client.query(`
        INSERT INTO "Article" 
          (id, "revisionId", chapter, "articleNumber", title, "contentText", "contentJson", "sortOrder", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10)
      `, [
        randomUUID(),
        data.revId,
        null,
        data.articleNumber,
        titleToRestore,
        `${numLabel} ${textToRestore}`,
        JSON.stringify(contentJson),
        data.sortOrderHint,
        now,
        now,
      ]);
      count++;
    }

    await client.query('COMMIT');
    console.log(`완료: ${count}개 본조항 복구됨`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e.message);
  } finally {
    client.release();
  }

} catch (e) {
  console.error(e.message);
} finally {
  await pool.end();
}
