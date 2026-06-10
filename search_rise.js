async function search() {
  const query = encodeURIComponent("RISE 사업단 운영세칙");
  const res = await fetch(`https://yewon-rules.pages.dev/api/rules/search?query=${query}&options=title`);
  const data = await res.json();
  console.log("Matches:", data.titleMatches.map(m => m.title));
  if (data.titleMatches.length > 0) {
    const ruleRes = await fetch(`https://yewon-rules.pages.dev/api/rules/${data.titleMatches[0].id}`);
    const ruleData = await ruleRes.json();
    const articles = ruleData.currentRevision.articles;
    
    // Find article 5
    const art5 = articles.find(a => a.articleNumber === 5);
    if (art5) {
      console.log("Article 5 ID:", art5.id);
      console.log("Article 5 contentHtml:", art5.contentHtml);
    }
    
    // Find article 7
    const art7 = articles.find(a => a.articleNumber === 7);
    if (art7) {
      console.log("Article 7 ID:", art7.id);
      console.log("Article 7 contentText:", art7.contentText);
      console.log("Article 7 contentJson:", art7.contentJson);
    }
  }
}
search();
