async function run() {
  const res = await fetch("https://yewon-rules.pages.dev/api/rules/search?query=산학협력단 간접비 관리운영 규정");
  const rules = await res.json();
  const rule = rules.bodyMatches?.[0] || rules.titleMatches?.[0] || rules.find(r => r.title.includes("산학협력단 간접비"));
  if (!rule) {
     const allRes = await fetch("https://yewon-rules.pages.dev/api/rules/search?query=");
     const allRules = await allRes.json();
     const found = allRules.find(r => r.title.includes("산학협력단 간접비"));
     if (found) {
       console.log("Found in all list:", found.id);
       await fetchRule(found.id);
     } else {
       console.log("Rule not found anywhere");
     }
     return;
  }
  
  const id = rule.ruleId || rule.id;
  await fetchRule(id);
}

async function fetchRule(id) {
  console.log("Fetching rule ID:", id);
  const start = Date.now();
  const res2 = await fetch("https://yewon-rules.pages.dev/api/rules/" + id);
  const time = Date.now() - start;
  
  console.log("Status:", res2.status, "Time:", time, "ms");
  if (res2.ok) {
    const data = await res2.json();
    console.log("Articles:", data.currentRevision?.articles?.length);
  } else {
    console.log("Failed:", await res2.text());
  }
}
run();
