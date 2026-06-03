async function run() {
  try {
    const res = await fetch("https://yewon-rules.pages.dev/api/rules/search?query=");
    const rules = await res.json();
    if (!rules || rules.length === 0) return console.log("No rules");
    
    const ruleId = rules[0].id;
    const res2 = await fetch("https://yewon-rules.pages.dev/api/rules/" + ruleId);
    const data = await res2.json();
    
    console.log(JSON.stringify(data).substring(0, 500));
  } catch (e) {
    console.log("Error", e);
  }
}
run();
