import fs from 'fs';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env' });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
     const res = await pool.query(`SELECT "fileUrl" FROM "Attachment" WHERE "fileType" ILIKE 'hwp' LIMIT 5`);
     for (const row of res.rows) {
        const filename = decodeURIComponent(row.fileUrl.split('/').pop()) + '.htm';
        const htmPath = 'E:\\예원예술대학교_규정관리시스템\\public\\files\\rules_html\\' + filename;
        if (!fs.existsSync(htmPath)) continue;

        const buf = fs.readFileSync(htmPath);
        let htmlStr = iconv.decode(buf, 'euc-kr');
        if (!htmlStr.includes('<html')) htmlStr = buf.toString('utf8');

        const $ = cheerio.load(htmlStr);
        const tags = {};
        $('body').children().each((i, el) => {
          const t = el.tagName.toLowerCase();
          tags[t] = (tags[t] || 0) + 1;
        });
        console.log(filename, "Body children tags:", tags);
     }
  } catch (e) {
     console.error(e);
  } finally {
     pool.end();
  }
})();
