const fs = require('fs');
const articles = JSON.parse(fs.readFileSync('pg_articles.json', 'utf-8'));
const art = articles.find(a => a.contentText && a.contentText.includes('2차 피해"란'));
if (art) {
  console.log(art.contentText);
} else {
  console.log("Not found in local dump.");
}
