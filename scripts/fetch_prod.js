async function run() {
  const res = await fetch('https://yewon-rules.vercel.app/api/rules/search?query=대학원');
  const data = await res.json();
  const rule = data.find(r => r.title.includes('대학원 학칙'));
  if (!rule) {
    console.log('Rule not found');
    return;
  }
  const ruleRes = await fetch(`https://yewon-rules.vercel.app/api/rules/${rule.id}`);
  const ruleData = await ruleRes.json();
  const articles = ruleData.currentRevision.articles;
  const addendums = articles.filter(a => a.articleNumber >= 8000);
  
  for (const a of addendums) {
    console.log(`[ID:${a.id}] title: ${a.title}`);
    console.log(`contentText: ${a.contentText}`);
    console.log('----------------');
  }
}
run().catch(console.error);
