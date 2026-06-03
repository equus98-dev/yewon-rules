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
    if (text.includes('건축기준면적')) {
       console.log("Found:", text);
       let parent = $(el).closest('p, div');
       console.log("Parent HTML:", $.html(parent));
       
       // check 5 elements before
       let prev = parent.prev();
       for(let j=0; j<5; j++) {
         if (prev.length) {
            console.log(`Prev ${j}: ${prev.text().replace(/\s+/g, ' ')}`);
            prev = prev.prev();
         }
       }
    }
  });

} catch (e) {
  console.error(e.message);
}
