const fs = require('fs');
const iconv = require('iconv-lite');
const buf = fs.readFileSync('all_articles.json');
const text = iconv.decode(buf, 'euc-kr');
const data = JSON.parse(text);
const matches = data.filter(d => (d.title && d.title.includes('부')) || (d.contentText && d.contentText.includes('시행한다') && d.contentText.includes('2015년 2월 16일')));
console.log(JSON.stringify(matches, null, 2));
