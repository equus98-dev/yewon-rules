const fs = require('fs');
const articles = JSON.parse(fs.readFileSync('all_articles.json'));
const hits = articles.filter(a => a.contentText && a.contentText.includes('매니지먼트'));
console.log(hits.map(h => ({title: h.title, revId: h.revisionId, text: h.contentText.substring(0, 50)})));
