import pg from 'pg';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import iconv from 'iconv-lite';
import * as cheerio from 'cheerio';

config({ path: '.env' });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function normalizeKoreanText(text) {
  // Remove zero-width spaces, multiple spaces, etc.
  return text.replace(/\s+/g, ' ').trim();
}

try {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Fetch all articles
    const res = await client.query(`
      SELECT a.id, r.title as "ruleTitle", a."articleNumber", a.title as "articleTitle", a."contentJson", att."fileUrl"
      FROM "Article" a
      JOIN "Revision" rv ON a."revisionId" = rv.id
      JOIN "Rule" r ON rv."ruleId" = r.id
      LEFT JOIN "Attachment" att ON att."ruleId" = r.id
    `);

    // Group articles by fileUrl to avoid reloading HTML file multiple times
    const articlesByFile = {};
    for (const row of res.rows) {
      if (!row.fileUrl) continue;
      const filename = decodeURIComponent(row.fileUrl.split('/').pop());
      if (!articlesByFile[filename]) {
        articlesByFile[filename] = [];
      }
      articlesByFile[filename].push(row);
    }

    let tablesInjectedCount = 0;

    for (const [filename, articles] of Object.entries(articlesByFile)) {
      const htmPath = path.join('E:', '예원예술대학교_규정관리시스템', 'scratch', 'hwp_html', filename + '.htm');
      if (!fs.existsSync(htmPath)) {
        continue; // Skip if HTM file wasn't generated
      }

      const buf = fs.readFileSync(htmPath);
      // Decode from CP949 since HWP SaveAs HTML usually produces ANSI encoded files
      let htmlStr = iconv.decode(buf, 'euc-kr');
      if (!htmlStr.includes('<html')) {
        htmlStr = buf.toString('utf8'); // fallback
      }

      const $ = cheerio.load(htmlStr);

      for (const row of articles) {
        // Look for 제N조 in the document
        // We match exactly the article number
        let articleNode = null;
        
        // Find node containing 제N조
        const searchStr = `제${row.articleNumber}조`;
        $('*').each((i, el) => {
          const text = normalizeKoreanText($(el).text());
          if (text.startsWith(searchStr + '(') || text.startsWith(searchStr + ' ')) {
            // Found a potential match
            // To ensure we get the block element (P or DIV)
            articleNode = $(el).closest('p, div');
          }
        });

        if (!articleNode || articleNode.length === 0) {
          continue;
        }

        // Look at subsequent siblings
        let next = articleNode.next();
        let foundTable = null;
        for (let i = 0; i < 15; i++) {
          if (!next || next.length === 0) break;
          const tagName = next.prop('tagName');
          if (!tagName) break;

          const tagUpper = tagName.toUpperCase();
          if (tagUpper === 'TABLE') {
            foundTable = next;
            break;
          }
          
          const text = normalizeKoreanText(next.text());
          if (text.match(/^제\d+조/)) {
             // Reached next article before finding table
             break;
          }
          if (text.match(/^부\s*칙/)) {
             // Reached addendum before finding table
             break;
          }

          next = next.next();
        }

        if (foundTable) {
          const tableHtml = $.html(foundTable);
          
          // Check if DB already has it
          let newJson = row.contentJson;
          if (typeof newJson === 'string') newJson = JSON.parse(newJson);
          if (!Array.isArray(newJson)) newJson = [newJson];

          let hasTable = false;
          for (const item of newJson) {
            if (item.text && item.text.includes('<table')) {
              hasTable = true;
            }
          }

          if (!hasTable) {
            // Append the table as a new text item
            newJson.push({
              type: 'text',
              num: '',
              text: tableHtml
            });

            await client.query(`
              UPDATE "Article"
              SET "contentJson" = $1::jsonb
              WHERE id = $2
            `, [JSON.stringify(newJson), row.id]);

            console.log(`[표 추가 성공] ${row.ruleTitle} - 제${row.articleNumber}조`);
            tablesInjectedCount++;
          }
        }
      }
    }

    await client.query('COMMIT');
    console.log(`\n작업 완료! 총 ${tablesInjectedCount}개의 조항에 표(Table)를 추가했습니다.`);
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
