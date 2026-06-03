/**
 * DB의 Article contentJson을 파싱하여
 * 각 조(제N조)를 개별 Article 레코드로 분리 저장하는 스크립트
 */
import pg from 'pg';
import { config } from 'dotenv';
import { randomUUID } from 'crypto';
config({ path: '.env' });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * contentJson 배열을 조항별로 그룹핑
 * type === 'article' 인 항목이 새 조항의 시작
 */
function groupArticles(contentJson) {
  const articles = [];
  let current = null;

  for (const item of contentJson) {
    if (item.type === 'article') {
      if (current) articles.push(current);
      
      // 조 번호 파싱: "제1조(목적)" -> articleNumber: 1, title: "목적"
      const matchKor = item.num.match(/제(\d+)조[（(]?([^)）]*)[)）]?/);
      let articleNumber = articles.length + 1;
      let title = item.num;
      
      if (matchKor) {
        articleNumber = parseInt(matchKor[1], 10);
        title = matchKor[2] || item.num;
      }
      
      current = {
        articleNumber,
        title: title.trim(),
        num: item.num,
        items: [item],
        contentParts: [`${item.num} ${item.text}`],
      };
    } else if (current && (item.type === 'paragraph' || item.type === 'item')) {
      current.items.push(item);
      const prefix = item.num ? `${item.num} ` : '';
      current.contentParts.push(`${prefix}${item.text}`);
    }
    // type === 'text' (부칙, 제목 등) 은 현재 조항에 포함 안 함
  }
  
  if (current) articles.push(current);
  return articles;
}

try {
  // Revision 별로 Article 수가 1개이면서 contentJson에 article 타입 항목이 여러 개인 경우 찾기
  const targetRes = await pool.query(`
    SELECT 
      a.id as "articleId", 
      a."revisionId", 
      a."contentJson",
      r.title as "ruleTitle",
      rv."versionName",
      (SELECT COUNT(*) FROM "Article" a2 WHERE a2."revisionId" = a."revisionId") as "artCount"
    FROM "Article" a
    JOIN "Revision" rv ON a."revisionId" = rv.id
    JOIN "Rule" r ON rv."ruleId" = r.id
    WHERE a."contentJson" IS NOT NULL
    ORDER BY r.title
  `);
  
  // 실제 처리할 대상: contentJson의 type=article 항목이 2개 이상이고 Article이 1개인 리비전
  const toProcess = [];
  for (const row of targetRes.rows) {
    const json = row.contentJson;
    if (!Array.isArray(json)) continue;
    const articleItems = json.filter(x => x.type === 'article');
    if (articleItems.length >= 2 && parseInt(row.artCount) === 1) {
      toProcess.push(row);
    }
  }
  
  console.log(`\n처리 대상 규정 수: ${toProcess.length}`);
  for (const row of toProcess) {
    console.log(`  - ${row.ruleTitle} (${row.versionName})`);
  }
  
  if (toProcess.length === 0) {
    console.log('\n처리할 데이터 없음');
    process.exit(0);
  }
  
  for (const row of toProcess) {
    const contentJson = row.contentJson;
    const revisionId = row.revisionId;
    const oldArticleId = row.articleId;
    
    console.log(`\n[${row.ruleTitle}] 분리 시작...`);
    
    const parsedArticles = groupArticles(contentJson);
    console.log(`  - 파싱된 조항 수: ${parsedArticles.length}`);
    parsedArticles.forEach(a => console.log(`    제${a.articleNumber}조 (${a.title})`));
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 기존 1개짜리 Article 삭제
      await client.query(`DELETE FROM "Article" WHERE id = $1`, [oldArticleId]);
      
      // 새 Article들 삽입
      for (let i = 0; i < parsedArticles.length; i++) {
        const art = parsedArticles[i];
        const contentText = art.contentParts.join('\n');
        
        const now = new Date().toISOString();
        await client.query(`
          INSERT INTO "Article" 
            (id, "revisionId", chapter, "articleNumber", title, "contentText", "contentJson", "sortOrder", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10)
        `, [
          randomUUID(),
          revisionId,
          null,
          art.articleNumber,
          art.title,
          contentText,
          JSON.stringify(art.items),
          i + 1,
          now,
          now,
        ]);
      }
      
      await client.query('COMMIT');
      console.log(`  ✅ ${parsedArticles.length}개 조항으로 분리 완료`);
    } catch (e) {
      await client.query('ROLLBACK');
      console.error(`  ❌ 오류:`, e.message);
    } finally {
      client.release();
    }
  }
  
  console.log('\n=== 전체 완료 ===');
} catch (e) {
  console.error('전체 오류:', e.message);
} finally {
  await pool.end();
}
