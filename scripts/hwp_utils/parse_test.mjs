import pg from 'pg';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import iconv from 'iconv-lite';
import * as cheerio from 'cheerio';
import { randomUUID } from 'crypto';

config({ path: '.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function fixRule(ruleId, ruleTitle) {
  const client = await pool.connect();
  try {
    // get active revision
    const revRes = await client.query(`SELECT id FROM "Revision" WHERE "ruleId" = $1 ORDER BY "createdAt" DESC LIMIT 1`, [ruleId]);
    if (revRes.rowCount === 0) return;
    const revId = revRes.rows[0].id;

    // get html file
    const fileRes = await client.query(`SELECT "fileUrl" FROM "Attachment" WHERE "ruleId" = $1 AND "fileType" ILIKE 'hwp'`, [ruleId]);
    if (fileRes.rowCount === 0) return;
    const filename = decodeURIComponent(fileRes.rows[0].fileUrl.split('/').pop()) + '.htm';
    const htmPath = path.join('E:', '예원예술대학교_규정관리시스템', 'public', 'files', 'rules_html', filename);
    if (!fs.existsSync(htmPath)) return;

    const buf = fs.readFileSync(htmPath);
    let htmlStr = iconv.decode(buf, 'euc-kr');
    if (!htmlStr.includes('<html')) htmlStr = buf.toString('utf8');

    const $ = cheerio.load(htmlStr);
    let articles = [];
    let currentArticle = null;
    let sortOrder = 1;

    $('p, div, span, table').each((i, el) => {
      const tagName = el.tagName.toLowerCase();
      
      // 테이블 처리
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

      // 조항 시작 정규식
      // 매치: "제43조", "제43조의 2", "제43조의2", "제43조 의 2"
      const articleMatch = text.match(/^제\s*(\d+)\s*조(?:\s*의\s*(\d+))?\s*(?:[（(]([^)）]*)[)）])?(.*)/);
      const isAddendum = text.replace(/\s+/g, '').startsWith('부칙');
      
      if (articleMatch) {
         if (currentArticle) articles.push(currentArticle);
         
         const artNum = parseInt(articleMatch[1], 10);
         const subNumStr = articleMatch[2];
         const titleStr = articleMatch[3] ? articleMatch[3].trim() : '';
         let restText = articleMatch[4] ? articleMatch[4].trim() : '';

         let finalTitle = titleStr;
         if (subNumStr) {
            finalTitle = `의 ${subNumStr}(${titleStr})`;
         } else if (!titleStr) {
            finalTitle = `제${artNum}조`;
         }

         let numLabel = `제${artNum}조`;
         if (subNumStr) numLabel += `의 ${subNumStr}`;
         if (titleStr) numLabel += `(${titleStr})`;

         currentArticle = {
            articleNumber: artNum,
            title: finalTitle,
            contentJson: [],
            sortOrder: sortOrder++
         };
         
         currentArticle.contentJson.push({
            type: 'article',
            num: numLabel,
            text: restText
         });
      } else if (isAddendum) {
         // 부칙
         if (currentArticle) articles.push(currentArticle);
         currentArticle = {
            articleNumber: 9000,
            title: '부칙',
            contentJson: [{ type: 'text', text: text }],
            sortOrder: sortOrder++
         };
      } else if (currentArticle) {
         // 문단/항/호 분류
         const firstChar = text.charAt(0);
         const matchItem = text.match(/^(\d+)\./);
         
         if (['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩'].includes(firstChar)) {
             currentArticle.contentJson.push({ type: 'paragraph', num: firstChar, text: text.substring(1).trim() });
         } else if (matchItem) {
             currentArticle.contentJson.push({ type: 'item', num: matchItem[1] + '.', text: text.substring(matchItem[0].length).trim() });
         } else {
             currentArticle.contentJson.push({ type: 'text', text: text });
         }
      }
    });

    if (currentArticle) articles.push(currentArticle);

    // TODO: Insert into DB
    console.log(`Parsed ${articles.length} articles for ${ruleTitle}`);
    const a43 = articles.filter(a => a.articleNumber === 43);
    console.log(a43.map(a => a.title));
    
  } finally {
    client.release();
  }
}

(async () => {
  try {
     const res = await pool.query(`SELECT id, title FROM "Rule" WHERE title LIKE '%학업이수에 관한 규정%'`);
     for (const r of res.rows) {
        await fixRule(r.id, r.title);
     }
  } catch (e) {
     console.error(e);
  } finally {
     pool.end();
  }
})();
