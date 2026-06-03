import pg from 'pg';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import iconv from 'iconv-lite';
import * as cheerio from 'cheerio';

config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function parseRule(ruleId) {
  const client = await pool.connect();
  try {
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
    let hasSeenBody = false;

    // 장, 절 등 챕터 추적용
    let currentChapter = null;
    let currentSection = null;

    $('p, div, span, table').each((i, el) => {
      const tagName = el.tagName.toLowerCase();
      
      if (tagName === 'table') {
         if (currentArticle) {
            currentArticle.contentJson.push({
               type: 'text',
               text: $.html(el)
            });
         }
         return;
      }

      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (!text) return;
      
      // 스킵조건: 빈 텍스트나 이상한 메타데이터 등
      if (text.startsWith('<') && text.endsWith('>')) return; // 스타일 태그 쓰레기 등

      const articleMatch = text.match(/^제\s*(\d+)\s*조(?:\s*의\s*(\d+))?\s*(?:[（(]([^)）]*)[)）])?(.*)/);
      const isAddendum = text.replace(/\s+/g, '').startsWith('부칙');
      const chapterMatch = text.match(/^제\s*(\d+)\s*장\s+(.*)/);
      const sectionMatch = text.match(/^제\s*(\d+)\s*절\s+(.*)/);

      if (chapterMatch) {
         currentChapter = text;
         currentSection = null; // 장이 바뀌면 절 초기화
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
         hasSeenBody = true;
         
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
            articleNumber: artNum,
            title: finalTitle,
            chapter: currentChapter,
            section: currentSection,
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
         hasSeenBody = true;
         currentArticle = {
            articleNumber: 8000 + sortOrder, // 부칙은 8000번대로 임시 지정
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
             // 만약 똑같은 "제N조(제목)"이 다시 반복된다면 무시할 수 있습니다.
             const isDuplicateHeader = text === currentArticle.contentJson[0].num;
             if (!isDuplicateHeader) {
                 currentArticle.contentJson.push({ type: 'text', text: text });
             }
         }
      } else {
         // 조항 시작 전 (총칙 위쪽)
         articles.push({ type: 'pre_text', text: text });
      }
    });

    if (currentArticle) articles.push(currentArticle);
    return articles;
  } finally {
    client.release();
  }
}

(async () => {
  try {
     const res = await pool.query(`SELECT id, title FROM "Rule" WHERE title LIKE '%학업이수에 관한 규정%'`);
     if (res.rows.length > 0) {
        const parsed = await parseRule(res.rows[0].id);
        fs.writeFileSync('parsed_test.json', JSON.stringify(parsed, null, 2));
        console.log('Saved to parsed_test.json');
     }
  } catch (e) {
     console.error(e);
  } finally {
     pool.end();
  }
})();
