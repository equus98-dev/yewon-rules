const fs = require('fs');
const iconv = require('iconv-lite');
const buf = fs.readFileSync('addendum.json');
const text = iconv.decode(buf, 'euc-kr');
const data = JSON.parse(text);
const match = data.find(d => d.contentText && d.contentText.includes('설립학칙'));
console.log(match);
