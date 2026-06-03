import * as cheerio from 'cheerio';
import fs from 'fs';
import iconv from 'iconv-lite';

try {
  const htmlPath = 'E:\\예원예술대학교_규정관리시스템\\public\\files\\rules_html\\1-0-1_학교법인_예원예술대학교_정관.hwp.htm';
  if (!fs.existsSync(htmlPath)) {
     console.log("Not converted yet. Try later.");
     process.exit(0);
  }
  
  const buf = fs.readFileSync(htmlPath);
  let htmlStr = iconv.decode(buf, 'euc-kr');
  if (!htmlStr.includes('<html')) htmlStr = buf.toString('utf8');

  const $ = cheerio.load(htmlStr);
  
  $('body').children().each((i, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text.match(/^[\[<]?(별표|서식|별지)/i) && text.length < 150) {
       console.log(`[FOUND HEADER] ${text}`);
    }
  });

} catch (e) {
  console.error(e.message);
}
