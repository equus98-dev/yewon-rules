import * as cheerio from 'cheerio';
import fs from 'fs';
import iconv from 'iconv-lite';

try {
  const htmlPath = 'E:\\예원예술대학교_규정관리시스템\\scratch\\hwp_html\\정관.htm';
  const buf = fs.readFileSync(htmlPath);
  const html = iconv.decode(buf, 'euc-kr'); // Decode from CP949/EUC-KR
  
  const $ = cheerio.load(html);
  
  // Find the element containing '제77조'
  const el = $('*:contains("제77조")').last();
  console.log("Found 제77조 tag:", el.prop('tagName'));
  
  const blockEl = el.closest('p, div');
  console.log("Block element:", blockEl.prop('tagName'));
  
  let next = blockEl.next();
  for(let i=0; i<5; i++) {
     if(next.length) {
       console.log(`Next ${i}:`, next.prop('tagName'), next.text().substring(0, 50).replace(/\n/g, ' '));
       next = next.next();
     }
  }

} catch (e) {
  console.error(e.message);
}
