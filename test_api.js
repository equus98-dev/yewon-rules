const http = require('http');

http.get('http://127.0.0.1:3000/api/rules/search?query=정관', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      const ruleId = parsed.rules[0].id;
      
      http.get('http://127.0.0.1:3000/api/rules/' + ruleId, (res2) => {
         let data2 = '';
         res2.on('data', chunk => data2 += chunk);
         res2.on('end', () => {
            const ruleData = JSON.parse(data2);
            const addendums = ruleData.currentRevision.articles.filter(a => a.articleNumber >= 8000);
            console.log(JSON.stringify(addendums.map(a => ({ id: a.id, title: a.title })), null, 2));
         });
      });
    } catch(e) { console.log(e.message); }
  });
}).on('error', err => console.log(err.message));
