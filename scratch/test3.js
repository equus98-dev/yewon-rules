const fs = require('fs');
const iconv = require('iconv-lite');
const buf = fs.readFileSync('addendum.json');
const text = iconv.decode(buf, 'euc-kr');
fs.writeFileSync('scratch/addendum_utf8.json', text, 'utf8');
