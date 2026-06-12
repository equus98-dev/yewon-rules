async function run() {
  const searchUrl = `https://yewon-rules.pages.dev/api/rules/search?query=${encodeURIComponent("대학원 학칙")}&options=title`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  
  const rule = searchData.titleMatches.find(r => r.title === "대학원 학칙");
  
  const ruleUrl = `https://yewon-rules.pages.dev/api/rules/${rule.id}`;
  const ruleRes = await fetch(ruleUrl);
  const ruleData = await ruleRes.json();
  
  const addendums = ruleData.currentRevision.articles.filter(a => a.articleNumber >= 8000 && a.articleNumber < 9000).sort((a,b)=>a.articleNumber - b.articleNumber);
  
  addendums.forEach(a => {
    console.log(`[${a.articleNumber}] Title: ${a.title}`);
    console.log(`Text: ${a.contentText}`);
    console.log("----");
  });
}
run();
