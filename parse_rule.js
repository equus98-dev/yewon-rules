const fs = require('fs');
const data = JSON.parse(fs.readFileSync('temp_rule.json', 'utf8'));

const article71 = data.rule.articles.find(a => a.articleNumber === 71);
const article72 = data.rule.articles.find(a => a.articleNumber === 72);
const article70_2 = data.rule.articles.find(a => a.articleNumber === 70);

console.log("Article 71:", article71 ? JSON.stringify(article71.contentJson) : "Not found");
console.log("Article 72:", article72 ? JSON.stringify(article72.contentJson) : "Not found");
