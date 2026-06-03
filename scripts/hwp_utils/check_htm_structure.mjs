import fs from 'fs';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

const buf = fs.readFileSync('E:\\예원예술대학교_규정관리시스템\\public\\files\\rules_html\\2-0-3_학업이수에_관한_규정.hwp.htm');
let htmlStr = iconv.decode(buf, 'euc-kr');
if (!htmlStr.includes('<html')) htmlStr = buf.toString('utf8');

const $ = cheerio.load(htmlStr);

// Find the first table
const table = $('table').first();
console.log("Table parents:", table.parents().map((i, el) => el.tagName).get().join(', '));
console.log("Table contents example:", table.find('p').length, "paragraphs inside table");
