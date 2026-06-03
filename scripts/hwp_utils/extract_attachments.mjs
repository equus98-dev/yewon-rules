import pg from 'pg';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import iconv from 'iconv-lite';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

config({ path: '.env' });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function normalizeKoreanText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

try {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Get unique rules and their file URLs
    const res = await client.query(`
      SELECT r.id as "ruleId", r.title as "ruleTitle", rv.id as "revisionId", att."fileUrl"
      FROM "Rule" r
      JOIN "Revision" rv ON r.id = rv."ruleId"
      LEFT JOIN "Attachment" att ON att."ruleId" = r.id
      WHERE rv.version = (SELECT MAX(version) FROM "Revision" WHERE "ruleId" = r.id)
    `);

    let attachmentsInjectedCount = 0;

    for (const row of res.rows) {
      if (!row.fileUrl) continue;
      const filename = decodeURIComponent(row.fileUrl.split('/').pop());
      const htmPath = path.join('E:', '예원예술대학교_규정관리시스템', 'public', 'files', 'rules_html', filename + '.htm');
      
      if (!fs.existsSync(htmPath)) {
        continue;
      }

      const buf = fs.readFileSync(htmPath);
      let htmlStr = iconv.decode(buf, 'euc-kr');
      if (!htmlStr.includes('<html')) htmlStr = buf.toString('utf8');

      const $ = cheerio.load(htmlStr);

      let currentAttachment = null;
      const attachments = [];

      $('body').children().each((i, el) => {
        const text = normalizeKoreanText($(el).text());
        const match = text.match(/^\s*[\[<「]?(별표|서식|별지)\s*제?\d+([^\]>」]*)[\]>」]?/i);
        
        if (match && text.length < 100) {
           if (currentAttachment) {
               attachments.push(currentAttachment);
           }
           currentAttachment = {
               title: text,
               elements: [el]
           };
        } else if (currentAttachment) {
           currentAttachment.elements.push(el);
        }
      });

      if (currentAttachment) {
         attachments.push(currentAttachment);
      }

      if (attachments.length > 0) {
         const existingCheck = await client.query(`
            SELECT id FROM "Article" WHERE "revisionId" = $1 AND "articleNumber" >= 9000
         `, [row.revisionId]);

         if (existingCheck.rows.length === 0) {
            let articleNumber = 9000;
            for (const att of attachments) {
               const wrapper = $('<div></div>');
               for (const el of att.elements) {
                  wrapper.append($(el).clone());
               }

               wrapper.find('img').each((idx, img) => {
                  const src = $(img).attr('src');
                  if (src && !src.startsWith('http')) {
                     $(img).attr('src', `/files/rules_html/${src}`);
                  }
               });

               const finalHtml = wrapper.html();

               await client.query(`
                  INSERT INTO "Article" ("id", "revisionId", "articleNumber", "title", "contentJson", "contentHtml", "contentText", "createdAt", "updatedAt")
                  VALUES ($1, $2, $3, $4, '[]'::jsonb, $5, '', NOW(), NOW())
               `, [crypto.randomUUID(), row.revisionId, articleNumber, att.title, finalHtml]);

               articleNumber++;
               attachmentsInjectedCount++;
               console.log(`[별표/서식 추가] ${row.ruleTitle} - ${att.title}`);
            }
         }
      }
    }

    await client.query('COMMIT');
    console.log(`\n작업 완료! 총 ${attachmentsInjectedCount}개의 별표/서식을 DB 조항으로 추가했습니다.`);
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
