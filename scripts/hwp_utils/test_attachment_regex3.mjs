import * as cheerio from 'cheerio';
import fs from 'fs';
import iconv from 'iconv-lite';

try {
  const htmlPath = 'E:\\예원예술대학교_규정관리시스템\\public\\files\\rules_html\\1-0-1_학교법인_예원예술대학교_정관.hwp.htm';
  const buf = fs.readFileSync(htmlPath);
  let htmlStr = iconv.decode(buf, 'euc-kr');
  if (!htmlStr.includes('<html')) htmlStr = buf.toString('utf8');

  const $ = cheerio.load(htmlStr);
  
  $('p, div, span').each((i, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text.includes('별표') || text.includes('서식')) {
       console.log("Found:", text);
    }
  });

} catch (e) {
  console.error(e.message);
}
