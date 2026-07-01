const fs = require('fs');
const iconv = require('iconv-lite');
const buf = fs.readFileSync('all_articles.json');
const text = iconv.decode(buf, 'euc-kr');
const data = JSON.parse(text);
const matches = data.filter(d => (d.ruleNumber === '1-0-1' || (d.ruleId && d.ruleId.includes('1-0-1'))) && (d.title || '').includes('부'));
console.log(JSON.stringify(matches, null, 2));
