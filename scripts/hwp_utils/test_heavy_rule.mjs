async function run() {
  const res = await fetch("https://yewon-rules.pages.dev/api/rules/search?query=학칙");
  const rules = await res.json();
  const rule = rules.bodyMatches?.[0] || rules.titleMatches?.[0];
  if (!rule) return console.log("학칙 not found");
  
  const id = rule.ruleId || rule.id;
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
