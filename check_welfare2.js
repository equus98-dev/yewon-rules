async function check() {
  const query = encodeURIComponent("사회복지대학원 학사운영 규정");
  const searchUrl = `https://yewon-rules.pages.dev/api/rules/search?query=${query}&options=title`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  const ruleId = searchData[0].id;
  
  const ruleUrl = `https://yewon-rules.pages.dev/api/rules/${ruleId}`;
  const ruleRes = await fetch(ruleUrl);
  const ruleData = await ruleRes.json();
  
  const arts = ruleData.currentRevision.articles.filter(a => a.articleNumber === 43 || a.articleNumber === 78 || a.articleNumber >= 9000);
  console.log("사회복지대학원:", JSON.stringify(arts, null, 2));

  const query2 = encodeURIComponent("일반대학원 학사운영 규정");
  const searchUrl2 = `https://yewon-rules.pages.dev/api/rules/search?query=${query2}&options=title`;
  const searchRes2 = await fetch(searchUrl2);
  const searchData2 = await searchRes2.json();
  const ruleId2 = searchData2.find(r => r.title === "일반대학원 학사운영 규정").id;
  
  const ruleUrl2 = `https://yewon-rules.pages.dev/api/rules/${ruleId2}`;
  const ruleRes2 = await fetch(ruleUrl2);
  const ruleData2 = await ruleRes2.json();
  
  const arts2 = ruleData2.currentRevision.articles.filter(a => a.contentHtml && a.contentHtml.includes("제6학기"));
  console.log("일반대학원:", JSON.stringify(arts2, null, 2));
}
check();
