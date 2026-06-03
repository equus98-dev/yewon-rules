import pg from 'pg';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import iconv from 'iconv-lite';

config({ path: '.env' });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function extractArticleText(fullText, articleNumber) {
  const lines = fullText.split(/\r?\n/).map(l => l.trimEnd());
  let inArticle = false;
  let articleLines = [];
  
  // Create a regex to match the start of the target article: "제12조(" or "제12조 "
  const startRegex = new RegExp(`^제\\s*${articleNumber}\\s*조(?:\\(|\\s|$)`);
  // Regex to match the start of ANY other article, chapter, or addendum to stop
  const stopRegex = /^(?:제\s*\d+\s*조(?:의\s*\d+)?(?:\[[^\]]*\])?(?:[ \t]*\(| )|부\s*칙|제\s*\d+\s*[장절관]|\[별표|\[서식)/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const stripped = line.trimStart();
    
    if (!inArticle) {
      if (startRegex.test(stripped)) {
        inArticle = true;
        articleLines.push(line);
      }
    } else {
      // If we hit the next article or chapter or addendum, stop collecting
      if (stopRegex.test(stripped) && !startRegex.test(stripped)) {
        break;
      }
      articleLines.push(line);
    }
  }
  
  // Trim empty lines at the end
  while (articleLines.length > 0 && articleLines[articleLines.length - 1].trim() === '') {
    articleLines.pop();
  }
  
  return articleLines.join('\n');
}

try {
  const missingRes = await pool.query(`
    SELECT a.id, a."articleNumber", a.title, r.title as "ruleTitle", att."fileUrl"
    FROM "Article" a
    JOIN "Revision" rv ON a."revisionId" = rv.id
    JOIN "Rule" r ON rv."ruleId" = r.id
    LEFT JOIN "Attachment" att ON att."ruleId" = r.id
    WHERE a."contentJson"::text LIKE '%시스템 오류로 조항 본문이 유실되었습니다%'
  `);

  console.log(`총 ${missingRes.rows.length}개의 복구 대상 조항을 찾았습니다.`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let updatedCount = 0;

    for (const row of missingRes.rows) {
      if (!row.fileUrl) {
        console.log(`[Skip] 첨부파일 URL 없음: ${row.ruleTitle} - 제${row.articleNumber}조`);
        continue;
      }

      const filename = decodeURIComponent(row.fileUrl.split('/').pop());
      const txtPath = path.join('E:', '예원예술대학교_규정관리시스템', 'scratch', 'hwp_texts', filename + '.txt');

      if (!fs.existsSync(txtPath)) {
        console.log(`[Skip] 텍스트 파일 없음: ${txtPath}`);
        continue;
      }

      const buf = fs.readFileSync(txtPath);
      // HWP SaveAs Text creates CP949 or UTF-16LE. Let's try UTF-16LE first.
      let fullText = buf.toString('utf16le');
      
      // If it doesn't look like Korean, try cp949
      if (fullText.includes('') || !/가-힣/.test(fullText)) {
        fullText = iconv.decode(buf, 'euc-kr');
      }

      const extractedText = extractArticleText(fullText, row.articleNumber);
      
      if (!extractedText || extractedText.trim() === '') {
        console.log(`[Warn] 텍스트 파싱 실패: ${row.ruleTitle} - 제${row.articleNumber}조`);
        continue;
      }

      console.log(`\n[성공] ${row.ruleTitle} - 제${row.articleNumber}조 추출 완료:`);
      console.log(extractedText.split('\n')[0] + (extractedText.includes('\n') ? ' ...' : ''));

      let contentJson = [];
      let parsedNum = extractedText.split('\n')[0].trim();
      let parsedText = extractedText.split('\n').slice(1).join('\n').trim();
      
      // If the article is a single line, use it as both num and text or handle it
      if (parsedText === '') {
         // e.g. "제1조(목적) 이 법인은 ..."
         const match = parsedNum.match(/^(제\s*\d+\s*조(?:\([^)]+\))?)\s*(.*)/);
         if (match) {
            parsedNum = match[1];
            parsedText = match[2];
         }
      }

      contentJson = [
        {
          type: 'article',
          num: parsedNum,
          text: parsedText
        }
      ];

      await client.query(`
        UPDATE "Article"
        SET "contentText" = $1, "contentJson" = $2::jsonb
        WHERE id = $3
      `, [extractedText, JSON.stringify(contentJson), row.id]);

      updatedCount++;
    }

    await client.query('COMMIT');
    console.log(`\n완료: 총 ${updatedCount}개 조항 본문 복원 성공!`);
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
