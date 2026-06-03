import fs from 'fs';
import path from 'path';
import iconv from 'iconv-lite';
import * as cheerio from 'cheerio';

const htmPath = 'E:\\예원예술대학교_규정관리시스템\\public\\files\\rules_html\\2-0-3_학업이수에_관한_규정.hwp.htm';
const buf = fs.readFileSync(htmPath);
let htmlStr = iconv.decode(buf, 'euc-kr');
if (!htmlStr.includes('<html')) htmlStr = buf.toString('utf8');

const $ = cheerio.load(htmlStr);
let results = [];
$('p, div, span').each((i, el) => {
  const text = $(el).text().replace(/\s+/g, ' ').trim();
  if (text.includes('제43조')) {
     results.push(text);
  }
});
console.log(results.join('\n'));
