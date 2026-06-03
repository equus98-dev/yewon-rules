import pg from 'pg';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import iconv from 'iconv-lite';
import * as cheerio from 'cheerio';
import { randomUUID } from 'crypto';

config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function parseRule(client, ruleId, revId, ruleTitle) {
  const fileRes = await client.query(`SELECT "fileUrl" FROM "Attachment" WHERE "ruleId" = $1 AND "fileType" ILIKE 'hwp'`, [ruleId]);
  if (fileRes.rowCount === 0) return null;
  const filename = decodeURIComponent(fileRes.rows[0].fileUrl.split('/').pop()) + '.htm';
  const htmPath = path.join('E:', '예원예술대학교_규정관리시스템', 'public', 'files', 'rules_html', filename);
  if (!fs.existsSync(htmPath)) return null;

  const buf = fs.readFileSync(htmPath);
  let htmlStr = iconv.decode(buf, 'euc-kr');
  if (!htmlStr.includes('<html')) htmlStr = buf.toString('utf8');

  const $ = cheerio.load(htmlStr);
  let articles = [];
  let currentArticle = null;
  let sortOrder = 1;
  let currentChapter = null;
  let currentSection = null;
  let isAddendumMode = false;

  $('body').children('p, div, table, h1, h2, h3, h4, h5, h6').each((i, el) => {
    const tagName = el.tagName.toLowerCase();
    
    if (tagName === 'table') {
       if (currentArticle) {
          currentArticle.contentJson.push({ type: 'text', text: $.html(el) });
       }
       return;
    }

    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (!text) return;
    if (text.startsWith('<') && text.endsWith('>')) return;

    // "의 N" 분리 파싱 정규식
    const articleMatch = text.match(/^제\s*(\d+)\s*조(?:\s*의\s*(\d+))?\s*(?:[（(]([^)）]*)[)）])?(.*)/);
    const isAddendum = text.replace(/\s+/g, '').startsWith('부칙');
    if (isAddendum) isAddendumMode = true;
    const chapterMatch = text.match(/^제\s*(\d+)\s*[장편]\s+(.*)/);
    const sectionMatch = text.match(/^제\s*(\d+)\s*절\s+(.*)/);

    if (chapterMatch) {
       currentChapter = text;
       currentSection = null;
       if (!currentArticle) {
           articles.push({ type: 'chapter', text: text });
       } else {
           currentArticle.contentJson.push({ type: 'chapter', text: text });
       }
       return;
    }

    if (sectionMatch) {
       currentSection = text;
       if (!currentArticle) {
           articles.push({ type: 'section', text: text });
       } else {
           currentArticle.contentJson.push({ type: 'section', text: text });
       }
       return;
    }
    
    if (articleMatch) {
       if (currentArticle) articles.push(currentArticle);
       
       const artNum = parseInt(articleMatch[1], 10);
       const subNumStr = articleMatch[2];
       const titleStr = articleMatch[3] ? articleMatch[3].trim() : '';
       let restText = articleMatch[4] ? articleMatch[4].trim() : '';

       let finalTitle = titleStr;
       if (subNumStr) {
          finalTitle = `의${subNumStr}(${titleStr})`;
       } else if (!titleStr) {
          finalTitle = `제${artNum}조`;
       }

       let numLabel = `제${artNum}조`;
       if (subNumStr) numLabel += `의${subNumStr}`;
       if (titleStr) numLabel += `(${titleStr})`;

       currentArticle = {
          articleNumber: isAddendumMode ? 8000 + sortOrder : artNum,
          title: isAddendumMode ? `부칙 ${numLabel}` : finalTitle,
          chapter: isAddendumMode ? null : currentChapter,
          section: isAddendumMode ? null : currentSection,
          contentJson: [],
          sortOrder: sortOrder++
       };
       
       currentArticle.contentJson.push({
          type: 'article',
          num: numLabel,
          text: restText
       });
    } else if (isAddendum) {
       if (currentArticle) articles.push(currentArticle);
       currentArticle = {
          articleNumber: 8000 + sortOrder,
          title: '부칙',
          contentJson: [{ type: 'text', text: text }],
          sortOrder: sortOrder++
       };
    } else if (currentArticle) {
       const firstChar = text.charAt(0);
       const matchItem = text.match(/^(\d+)\./);
       const matchSubItem = text.match(/^([가-하])\./);
       
       if (['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫','⑬','⑭','⑮'].includes(firstChar)) {
           currentArticle.contentJson.push({ type: 'paragraph', num: firstChar, text: text.substring(1).trim() });
       } else if (matchItem) {
           currentArticle.contentJson.push({ type: 'item', num: matchItem[1] + '.', text: text.substring(matchItem[0].length).trim() });
       } else if (matchSubItem) {
           currentArticle.contentJson.push({ type: 'subitem', num: matchSubItem[1] + '.', text: text.substring(matchSubItem[0].length).trim() });
       } else {
           const isDuplicateHeader = text === currentArticle.contentJson[0].num;
           if (!isDuplicateHeader) {
               currentArticle.contentJson.push({ type: 'text', text: text });
           }
       }
    } else {
       articles.push({ type: 'pre_text', text: text });
    }
  });

  if (currentArticle) articles.push(currentArticle);

  // 중복된 조항(Outline 등 잔상) 병합/제거 로직
  let finalArticles = [];
  for (let a of articles) {
    if (!a.articleNumber) continue; // skip pre_text, chapter not inside article

    const last = finalArticles[finalArticles.length - 1];
    if (last && last.articleNumber === a.articleNumber && last.title === a.title) {
       // 중복 발생 시, paragraph 등 더 구체적인 항목이 포함된 것을 선택
       const lastHasPara = last.contentJson.some(i => i.type === 'paragraph');
       const aHasPara = a.contentJson.some(i => i.type === 'paragraph');
       if (aHasPara && !lastHasPara) {
          finalArticles[finalArticles.length - 1] = a;
       } else if (!aHasPara && !lastHasPara) {
          // 둘 다 없는 경우 텍스트 길이 등 비교하거나 첫 번째 유지
          if (a.contentJson.length > last.contentJson.length) {
             finalArticles[finalArticles.length - 1] = a;
          }
       }
    } else {
       finalArticles.push(a);
    }
  }

  return finalArticles;
}

(async () => {
  console.log('전역 본문 데이터베이스 복원 스크립트 시작...');
  const client = await pool.connect();
  try {
    const revRes = await client.query(`
      SELECT rv.id as rev_id, r.id as rule_id, r.title 
      FROM "Revision" rv 
      JOIN "Rule" r ON rv."ruleId" = r.id
    `);

    let processedRules = 0;
    let totalInserted = 0;

    for (const row of revRes.rows) {
      const parsedArticles = await parseRule(client, row.rule_id, row.rev_id, row.title);
      if (!parsedArticles || parsedArticles.length === 0) continue;

      try {
        await client.query('BEGIN');

        // 별표/서식(9000이상) 보호, 나머지 일반 조항 및 부칙(8000번대) 삭제
        await client.query(`DELETE FROM "Article" WHERE "revisionId" = $1 AND "articleNumber" < 9000`, [row.rev_id]);

        const now = new Date().toISOString();
        let currentSortOrder = 1;

        for (const art of parsedArticles) {
           const contentText = art.contentJson.map(c => (c.num ? c.num + ' ' : '') + c.text).join('\n');
           
           await client.query(`
             INSERT INTO "Article" 
               (id, "revisionId", chapter, section, "articleNumber", title, "contentText", "contentJson", "sortOrder", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11)
           `, [
             randomUUID(),
             row.rev_id,
             art.chapter,
             art.section,
             art.articleNumber,
             art.title,
             contentText,
             JSON.stringify(art.contentJson),
             currentSortOrder++,
             now,
             now
           ]);
           totalInserted++;
        }

        // 보호된 별표/서식(9000이상)의 sortOrder를 새로 파싱된 본문 뒤로 순차적 업데이트
        const attRes = await client.query(`SELECT id FROM "Article" WHERE "revisionId" = $1 AND "articleNumber" >= 9000 ORDER BY "sortOrder"`, [row.rev_id]);
        for (const att of attRes.rows) {
           await client.query(`UPDATE "Article" SET "sortOrder" = $1 WHERE id = $2`, [currentSortOrder++, att.id]);
        }

        await client.query('COMMIT');
        processedRules++;
        if (processedRules % 10 === 0) {
           console.log(`... ${processedRules}개 규정 복원 완료 (총 삽입: ${totalInserted}건)`);
        }

      } catch (e) {
        await client.query('ROLLBACK');
        console.error(`Error processing rule ${row.title}:`, e.message);
      }
    }

    console.log(`\n🎉 모든 작업이 완료되었습니다!`);
    console.log(`복원 대상 규정 수: ${processedRules}`);
    console.log(`복원된 총 조항 수: ${totalInserted}`);

  } catch (e) {
    console.error('Fatal error:', e);
  } finally {
    client.release();
    pool.end();
  }
})();
