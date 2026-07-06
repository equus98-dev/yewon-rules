const https = require('https');
const http = require('http');

http.get('http://localhost:3000/api/rules/526db4d2-bca1-49c2-a890-22541179286e', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      const art63 = parsed.articles.find(a => a.articleNumber === 63);
      console.log("Article 63:");
      console.log(JSON.stringify(art63, null, 2));
      const art62 = parsed.articles.find(a => a.articleNumber === 62);
      console.log("Article 62:");
      console.log(JSON.stringify(art62, null, 2));
    } catch(e) {
      console.log(e);
    }
  });
});
