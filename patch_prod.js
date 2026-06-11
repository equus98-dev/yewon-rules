async function run() {
  try {
    const query = encodeURIComponent("RISE 사업단 운영세칙");
    const res = await fetch(`https://yewon-rules.pages.dev/api/rules/search?query=${query}&options=title`);
    const data = await res.json();
    const ruleRes = await fetch(`https://yewon-rules.pages.dev/api/rules/${data.titleMatches[0].id}`);
    const ruleData = await ruleRes.json();
    const articles = ruleData.currentRevision.articles;
    
    const art5 = articles.find(a => a.articleNumber === 5);
    
    const fs = require('fs');
    let html = fs.readFileSync('art5_fixed.html', 'utf8');
    
    console.log("Patching Article ID:", art5.id);
    
    const patchRes = await fetch(`https://yewon-rules.pages.dev/api/admin/articles/${art5.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ contentText: html, contentJson: art5.contentJson })
    });
    
    console.log("Patch Result:", patchRes.status, await patchRes.text());
  } catch (err) {
    console.error(err);
  }
}
run();
