/**
 * "제N조의M" 형태 조항 수정 스크립트
 * 
 * 문제: 외부 시스템에서 "제4조의2(외부위원의 임기 등)"를
 *   num: "제4조"
 *   text: "의2(외부위원의 임기 등) ..."
 * 형태로 저장함.
 * 
 * 해결:
 * 1. text가 "의N(...)" 패턴으로 시작하는 article 타입 항목을 감지
 * 2. 해당 조항의 title을 "의N(actual_title)"으로 재설정
 * 3. contentText를 올바른 "제N조의M(title)" 형태로 재구성
 * 4. sortOrder를 올바르게 재정렬
 */
import pg from 'pg';
import { config } from 'dotenv';
import { randomUUID } from 'crypto';
config({ path: '.env' });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * contentJson 배열을 조항별로 그룹핑 (의N 형태 처리 포함)
 */
function groupArticles(contentJson) {
  const articles = [];
  let current = null;
  let sortCounter = 0;

  for (const item of contentJson) {
    if (item.type === 'article') {
      if (current) articles.push(current);
      sortCounter++;

      let articleNumber = null;
      let subNumber = null;  // 의N의 N
      let title = '';
      let fullLabel = ''; // 표시용 레이블 (예: "제4조의2")
      
      // Case 1: num="제N조의M(title)" 또는 "제N조 의M(title)" 형태
      const matchFull = item.num.match(/제(\d+)조\s*의(\d+)[（(]?([^)）]*)[)）]?/);
      
      // Case 2: num="제N조(title)" 형태
      const matchSimple = item.num.match(/제(\d+)조[（(]?([^)）]*)[)）]?/);
      
      // Case 3: text가 "의N(title) ..." 또는 " N(title) ..." 형태로 시작하는 경우
      const textStartsWithSub = item.text.match(/^의(\d+)[（(]?([^)）]*)[)）]?\s*(.*)/s) 
                             || item.text.match(/^\s*(\d+)\s*[（(]([^)）]+)[)）]\s*(.*)/s);

      if (matchFull) {
        // "제4조의2(외부위원의 임기 등)" 형태
        articleNumber = parseInt(matchFull[1], 10);
        subNumber = parseInt(matchFull[2], 10);
        title = matchFull[3]?.trim() || `의${subNumber}`;
        fullLabel = `제${articleNumber}조의${subNumber}`;
      } else if (matchSimple && textStartsWithSub) {
        // num="제4조" + text="의2(외부위원의 임기 등) ..." 형태
        articleNumber = parseInt(matchSimple[1], 10);
        subNumber = parseInt(textStartsWithSub[1], 10);
        title = textStartsWithSub[2]?.trim() || `의${subNumber}`;
        fullLabel = `제${articleNumber}조의${subNumber}`;
        // text에서 의N(...) 부분 제거
        item.text = textStartsWithSub[3]?.trim() || item.text;
        item.num = `${fullLabel}(${title})`;
      } else if (matchSimple) {
        // 일반 "제N조(title)" 형태
        articleNumber = parseInt(matchSimple[1], 10);
        subNumber = null;
        title = matchSimple[2]?.trim() || item.num;
        fullLabel = `제${articleNumber}조`;
      } else {
        // 파싱 안 되면 기본값
        articleNumber = articles.length + 1;
        subNumber = null;
        title = item.num;
        fullLabel = item.num;
      }

      current = {
        articleNumber,
        subNumber,          // null이면 일반 조, 숫자면 의N 조
        title: title.trim(),
        fullLabel,
        sortOrder: sortCounter,
        items: [item],
        contentParts: [`${item.num} ${item.text}`],
      };
    } else if (current && (item.type === 'paragraph' || item.type === 'item')) {
      current.items.push(item);
      const prefix = item.num ? `${item.num} ` : '';
      current.contentParts.push(`${prefix}${item.text}`);
    }
  }
  
  if (current) articles.push(current);
  return articles;
}

try {
  // 전체 Revision 조회
  const revisionsRes = await pool.query(`
    SELECT rv.id as "revId", r.title as "ruleTitle"
    FROM "Revision" rv
    JOIN "Rule" r ON rv."ruleId" = r.id
    ORDER BY r.title
  `);
  
  let processedCount = 0;
  let fixedCount = 0;
  
  for (const { revId, ruleTitle } of revisionsRes.rows) {
    // 해당 Revision의 모든 Article 조회
    const artRes = await pool.query(`
      SELECT id, "articleNumber", title, "contentJson", "sortOrder"
      FROM "Article"
      WHERE "revisionId" = $1
      ORDER BY "sortOrder"
    `, [revId]);
    
    const articles = artRes.rows;
    
    // 전체 contentJson을 합쳐서 의N 패턴이 있는지 확인
    let hasSubArticle = false;
    const allJsonItems = [];
    for (const art of articles) {
      if (Array.isArray(art.contentJson)) {
        for (const item of art.contentJson) {
          allJsonItems.push(item);
          // text가 "의N(...)" 또는 " N(...)"으로 시작하는 article 타입 감지
          if (item.type === 'article') {
            if (/^의\d+/.test(item.text?.trim()) || /^\d+\s*[（(]/.test(item.text?.trim())) {
              hasSubArticle = true;
            }
          }
          // num에 의N 형태가 있는 경우도 감지
          if (item.type === 'article' && /제\d+조\s*의\d+/.test(item.num)) {
            hasSubArticle = true;
          }
        }
      }
    }
    
    if (!hasSubArticle) continue;
    
    // 이 Revision은 의N 조항이 있음 → 전체 재파싱
    processedCount++;
    const parsedArticles = groupArticles(allJsonItems);
    
    // 의N이 있는지 한번 더 확인
    const hasSub = parsedArticles.some(a => a.subNumber !== null);
    if (!hasSub) continue;
    
    console.log(`\n[${ruleTitle}] 의N 조항 수정 중...`);
    parsedArticles.filter(a => a.subNumber !== null).forEach(a => {
      console.log(`  → ${a.fullLabel}(${a.title})`);
    });
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 기존 Articles 삭제
      await client.query(`DELETE FROM "Article" WHERE "revisionId" = $1`, [revId]);
      
      // 새로 삽입 (의N 처리 포함)
      const now = new Date().toISOString();
      for (let i = 0; i < parsedArticles.length; i++) {
        const art = parsedArticles[i];
        const contentText = art.contentParts.join('\n');
        
        // title: 의N인 경우 "의N(actual_title)" 형태로 저장
        const storedTitle = art.subNumber !== null
          ? `의${art.subNumber}(${art.title})`
          : art.title;
        
        await client.query(`
          INSERT INTO "Article" 
            (id, "revisionId", chapter, "articleNumber", title, "contentText", "contentJson", "sortOrder", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10)
        `, [
          randomUUID(),
          revId,
          null,
          art.articleNumber,
          storedTitle,
          contentText,
          JSON.stringify(art.items),
          i + 1,
          now,
          now,
        ]);
      }
      
      await client.query('COMMIT');
      fixedCount++;
      console.log(`  ✅ ${parsedArticles.length}개 조항으로 재분리 완료`);
    } catch (e) {
      await client.query('ROLLBACK');
      console.error(`  ❌ 오류: ${e.message}`);
    } finally {
      client.release();
    }
  }
  
  console.log(`\n=== 완료: ${processedCount}개 Revision 검사, ${fixedCount}개 수정 ===`);
  
  // 최종 확인
  const totalRes = await pool.query(`SELECT COUNT(*) FROM "Article"`);
  console.log('전체 Article 수:', totalRes.rows[0].count);

} catch (e) {
  console.error('전체 오류:', e.message);
} finally {
  await pool.end();
}
