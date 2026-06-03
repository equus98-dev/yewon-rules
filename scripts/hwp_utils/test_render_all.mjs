async function run() {
  try {
    const res = await fetch("https://yewon-rules.pages.dev/api/rules/search?query=");
    const rules = await res.json();
    
    let crashCount = 0;
    
    for (const r of rules) {
      try {
        const res2 = await fetch("https://yewon-rules.pages.dev/api/rules/" + r.id);
        if (!res2.ok) {
          console.log("API Error for rule", r.id, res2.status);
          continue;
        }
        const ruleData = await res2.json();
        const currentRevision = ruleData.currentRevision;
        if (!currentRevision || !currentRevision.articles) continue;
        
        let toc = [];
        currentRevision.articles.forEach((a) => {
          let items = typeof a.contentJson === "string" ? JSON.parse(a.contentJson) : a.contentJson;
          if (!Array.isArray(items)) return;
          items.forEach((item) => {
            if (!item || typeof item !== 'object') return;
            if (item.type === "chapter") {
              const chapterText = typeof item.text === 'string' ? item.text : String(item.text || "");
              toc.push(chapterText.replace(new RegExp("\\s", "g"), '-'));
            }
          });
        });
      } catch (e) {
        console.log("Crash on rule:", r.title, e.message);
        crashCount++;
      }
    }
    console.log("Total crashes:", crashCount);
  } catch (e) {
    console.log("Error", e);
  }
}
run();
