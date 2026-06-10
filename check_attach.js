async function checkAttachments() {
  const query = encodeURIComponent("위임전결");
  const res = await fetch(`https://yewon-rules.pages.dev/api/rules/search?query=${query}&options=title`);
  const data = await res.json();
  console.log("Matches:", data.titleMatches.map(m => m.title));
  if (data.titleMatches.length > 0) {
    const ruleRes = await fetch(`https://yewon-rules.pages.dev/api/rules/${data.titleMatches[0].id}`);
    const ruleData = await ruleRes.json();
    console.log("Rule title:", ruleData.title);
    console.log("Rule number:", ruleData.ruleNumber);
    console.log("Attachments in DB:", ruleData.attachments);
    console.log("Attachments via Articles:", ruleData.currentRevision.articles.filter(a => a.articleNumber >= 9000).map(a => a.title));
  }
}
checkAttachments();
