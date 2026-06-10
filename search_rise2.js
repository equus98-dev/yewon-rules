async function search() {
  const query = encodeURIComponent("RISE 사업단 운영세칙");
  const res = await fetch(`https://yewon-rules.pages.dev/api/rules/search?query=${query}&options=title`);
  const data = await res.json();
  if (data.titleMatches.length > 0) {
    const ruleRes = await fetch(`https://yewon-rules.pages.dev/api/rules/${data.titleMatches[0].id}`);
    const ruleData = await ruleRes.json();
    const articles = ruleData.currentRevision.articles;
    
    // Find article 5
    const art5 = articles.find(a => a.articleNumber === 5);
    if (art5) {
      console.log("Article 5 contentText:", art5.contentText);
      console.log("Article 5 contentJson type:", typeof art5.contentJson);
      console.log("Article 5 contentJson:", JSON.stringify(art5.contentJson));
    }
  }
}
search();
