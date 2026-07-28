const fs = require('fs');
const data = JSON.parse(fs.readFileSync('all_articles.json', 'utf8'));

const keywords = ['국제매니지먼트', '글로벌문화', '단과대학'];

const results = [];

data.forEach(d => {
  if (d.results) {
    d.results.forEach(item => {
      const contentText = item.contentText || '';
      if (keywords.some(k => contentText.includes(k))) {
        results.push({
          ArticleTitle: item.title,
          ArticleNumber: item.articleNumber,
          Content: contentText.substring(0, 150).replace(/\n/g, ' ') + '...'
        });
      }
    });
  }
});

console.log(JSON.stringify(results, null, 2));
