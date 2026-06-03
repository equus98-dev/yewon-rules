/**
 * 중복 Article 레코드 제거 스크립트
 * revisionId + articleNumber 조합이 동일한 경우 가장 최근에 생성된 것만 남기고 나머지 삭제
 */
import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  console.log('=== 중복 Article 제거 시작 ===\n');
  
  // 중복 통계 먼저 확인
  const beforeCnt = await pool.query(`SELECT COUNT(*) FROM "Article"`);
  console.log('처리 전 Article 수:', beforeCnt.rows[0].count);
  
  const dupCount = await pool.query(`
    SELECT COUNT(*) as total FROM (
      SELECT "revisionId", "articleNumber"
      FROM "Article"
      GROUP BY "revisionId", "articleNumber"
      HAVING COUNT(*) > 1
    ) t
  `);
  console.log('중복 조합 수:', dupCount.rows[0].total, '건\n');
  
  // 중복 제거: 각 (revisionId, articleNumber) 조합에서 가장 최근 생성된 1개만 남기고 나머지 삭제
  // ArticleComparison 참조가 있을 수 있으므로 먼저 고아 레코드 처리 필요
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 삭제할 Article ID 목록: 같은 revisionId+articleNumber 중에서 createdAt이 가장 최신인 것만 남김
    const deleteRes = await client.query(`
      DELETE FROM "Article"
      WHERE id IN (
        SELECT id FROM (
          SELECT 
            id,
            ROW_NUMBER() OVER (
              PARTITION BY "revisionId", "articleNumber" 
              ORDER BY "createdAt" DESC, "sortOrder" ASC
            ) as rn
          FROM "Article"
        ) ranked
        WHERE rn > 1
      )
    `);
    
    await client.query('COMMIT');
    console.log(`✅ 삭제된 중복 Article 수: ${deleteRes.rowCount}개`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ 오류:', e.message);
    throw e;
  } finally {
    client.release();
  }
  
  // 결과 확인
  const afterCnt = await pool.query(`SELECT COUNT(*) FROM "Article"`);
  console.log('\n처리 후 Article 수:', afterCnt.rows[0].count);
  
  const dupAfter = await pool.query(`
    SELECT COUNT(*) as total FROM (
      SELECT "revisionId", "articleNumber"
      FROM "Article"
      GROUP BY "revisionId", "articleNumber"
      HAVING COUNT(*) > 1
    ) t
  `);
  console.log('남은 중복 조합 수:', dupAfter.rows[0].total, '건');
  
  // sortOrder 재정렬 (각 revision 내 조항 번호 순으로)
  console.log('\n=== sortOrder 재정렬 중... ===');
  const revisions = await pool.query(`SELECT DISTINCT "revisionId" FROM "Article"`);
  
  let fixed = 0;
  for (const row of revisions.rows) {
    await pool.query(`
      UPDATE "Article" a
      SET "sortOrder" = ranked.new_order
      FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY "revisionId" ORDER BY "articleNumber" ASC) as new_order
        FROM "Article"
        WHERE "revisionId" = $1
      ) ranked
      WHERE a.id = ranked.id
    `, [row.revisionId]);
    fixed++;
  }
  console.log(`✅ ${fixed}개 Revision의 sortOrder 재정렬 완료`);
  
  console.log('\n=== 완료 ===');
} catch (e) {
  console.error('전체 오류:', e.message);
} finally {
  await pool.end();
}
