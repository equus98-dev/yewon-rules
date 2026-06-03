import * as cheerio from 'cheerio';
import fs from 'fs';
import iconv from 'iconv-lite';

try {
  const htmlPath = 'E:\\예원예술대학교_규정관리시스템\\scratch\\hwp_html\\정관.htm';
  const buf = fs.readFileSync(htmlPath);
  let htmlStr = iconv.decode(buf, 'euc-kr');
  if (!htmlStr.includes('<html')) htmlStr = buf.toString('utf8');

  const $ = cheerio.load(htmlStr);
  
  let attachments = [];
  $('p, div, span').each((i, el) => {
    const text = $(el).text().trim();
    if (text.match(/^\[별표/)) {
       attachments.push(text);
       console.log('Found:', text.substring(0, 100));
    }
  });

} catch (e) {
  console.error(e.message);
}
