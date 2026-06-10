async function search() {
  const query = encodeURIComponent("RISE 사업단 운영세칙");
  const res = await fetch(`https://yewon-rules.pages.dev/api/rules/search?query=${query}&options=title`);
  const data = await res.json();
  const ruleRes = await fetch(`https://yewon-rules.pages.dev/api/rules/${data.titleMatches[0].id}`);
  const ruleData = await ruleRes.json();
  const articles = ruleData.currentRevision.articles;
  
  const art5 = articles.find(a => a.articleNumber === 5);
  const fs = require('fs');
  fs.writeFileSync('art5.html', art5.contentText);
}
search();
