const https = require('https');

https.get('https://yewon-rules.pages.dev/api/rules/1d13f9c3-169c-4740-8bfa-1994a5e2f75d', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    try {
        const json = JSON.parse(data);
        const art3 = json.articles.find(a => a.articleNumber === 3);
        console.log('Article 3:', art3.contentJson);
        const art3_2 = json.articles.find(a => a.articleNumber === 3 && a.subSection === 2); // Or however it's structured
        if (!art3_2) {
           const a3_2 = json.articles.find(a => String(a.articleNumber).startsWith("3") && a.title && a.title.includes("학부"));
           console.log('Article 3-2:', a3_2 ? a3_2.contentJson : 'not found');
        }
    } catch(e) {
        console.log('Error parsing JSON:', e.message);
        console.log('Raw data:', data.substring(0, 100));
    }
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
