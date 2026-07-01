const fs = require('fs');
const iconv = require('iconv-lite');
const buf = fs.readFileSync('all_articles.json');
const text = iconv.decode(buf, 'euc-kr');
const data = JSON.parse(text);
const matches = data.filter(d => (d.contentText || '').includes('설립학칙'));
if(matches.length > 0) {
  matches.forEach(m => {
    console.log("Found:", m.articleNumber, m.title);
    console.log("contentText:", m.contentText);
    console.log("contentHtml:", m.contentHtml);
  });
} else {
  console.log("Not found in all_articles.json either.");
}
