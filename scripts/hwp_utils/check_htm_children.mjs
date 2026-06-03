import fs from 'fs';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

const buf = fs.readFileSync('E:\\예원예술대학교_규정관리시스템\\public\\files\\rules_html\\2-0-3_학업이수에_관한_규정.hwp.htm');
let htmlStr = iconv.decode(buf, 'euc-kr');
if (!htmlStr.includes('<html')) htmlStr = buf.toString('utf8');

const $ = cheerio.load(htmlStr);
const children = $('body').children();
const tags = {};
children.each((i, el) => {
  const t = el.tagName.toLowerCase();
  tags[t] = (tags[t] || 0) + 1;
});
console.log("Body children tags:", tags);

const allParas = $('p').length;
const topParas = $('body > p').length;
console.log(`Total <p>: ${allParas}, Top-level <p>: ${topParas}`);
