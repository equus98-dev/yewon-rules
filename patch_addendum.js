async function run() {
  const query = encodeURIComponent("학교법인 예원예술대학교 정관");
  const searchUrl = `https://yewon-rules.pages.dev/api/rules/search?query=${query}&options=title`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  
  if (!searchData.titleMatches || searchData.titleMatches.length === 0) {
    console.log("Rule not found.");
    return;
  }
  
  for (const match of searchData.titleMatches) {
    console.log(`Processing Rule: ${match.title}`);
    const ruleUrl = `https://yewon-rules.pages.dev/api/rules/${match.id}`;
    const ruleRes = await fetch(ruleUrl);
    const ruleData = await ruleRes.json();
    
    if (!ruleData.currentRevision || !ruleData.currentRevision.articles) continue;
    
    const articles = ruleData.currentRevision.articles;
    const addendums = articles.filter(a => a.title && a.title.includes("부칙"));
    
    for (const a of addendums) {
      const origText = a.contentText;
      if (!origText) continue;
      
      let newContent = origText.replace(/^(부\s*칙(?:\([^)]+\))?)\s*/, "$1\n");
      newContent = newContent.replace(/^\s*(?:\d+\.|[①-⑮]\s*\.?)\s*(?=\()/gm, "");
      
      if (newContent !== origText) {
        console.log(`Patching Addendum ${a.id}`);
        const patchUrl = `https://yewon-rules.pages.dev/api/admin/articles/${a.id}`;
        await fetch(patchUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentText: newContent,
            contentJson: { text: newContent }
          })
        });
        console.log("Patched.");
      }
    }
  }
}

run().catch(console.error);
