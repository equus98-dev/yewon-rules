import fs from 'fs';

async function run() {
  try {
    const res = await fetch("https://yewon-rules.pages.dev/api/rules/search?query=");
    const rules = await res.json();
    
    for (const r of rules.slice(0, 10)) { // test first 10
      const res2 = await fetch("https://yewon-rules.pages.dev/api/rules/" + r.id);
      const ruleData = await res2.json();
      
      const currentRevision = ruleData.currentRevision;
      if (!currentRevision || !currentRevision.articles) continue;
      
      console.log("Testing rule:", ruleData.title);
      
      // Test TOC generation
      let toc = [];
      currentRevision.articles.forEach((a) => {
        try {
          let items = typeof a.contentJson === "string" ? JSON.parse(a.contentJson) : a.contentJson;
          if (!Array.isArray(items)) return;
          items.forEach((item) => {
            if (!item || typeof item !== 'object') return;
            if (item.type === "chapter") {
              const chapterText = typeof item.text === 'string' ? item.text : String(item.text || "");
              toc.push({ type: "chapter", id: `toc-${chapterText.replace(new RegExp("\\s", "g"), '-')}`, text: chapterText });
            } else if (item.type === "article") {
              const articleNum = typeof item.num === 'string' ? item.num : String(item.num || "");
              toc.push({ type: "article", id: `toc-${articleNum}`, text: articleNum });
            }
          });
        } catch (e) {
          console.error("TOC error", e);
        }
      });
      
      // Test Article rendering logic
      for (const a of currentRevision.articles) {
        let items = [];
        try {
          let parsed = a.contentJson;
          if (typeof a.contentJson === "string") {
            parsed = JSON.parse(a.contentJson);
          }
          if (Array.isArray(parsed)) {
            items = parsed;
          } else if (parsed && typeof parsed === "object") {
            if (Array.isArray(parsed.paragraphs)) {
              items = parsed.paragraphs.map(p => ({ type: "paragraph", num: "", text: String(p) }));
            }
          }
        } catch(e) {}
        
        if (!Array.isArray(items)) items = [];
        
        items.forEach(item => {
          if (!item || typeof item !== 'object') return;
          const safeText = item.text !== null && item.text !== undefined ? String(item.text) : "";
          const safeNum = item.num !== null && item.num !== undefined ? String(item.num) : "";
          
          if (item.type === "text" && typeof item.text === "string" && item.text.match(/\d-\d-\d-/)) {
            return;
          }
          
          if (item.type === "chapter") {
            const x = safeText.replace(/\s/g, '-');
          } else if (item.type === "section") {
            //
          } else if (item.type === "article") {
            //
          } else {
            const isTitle = safeText.includes("학칙");
            const indentLevel = safeText.match(/^\s*/)?.[0].length || 0;
            // 
          }
        });
      }
    }
    console.log("All passed");
  } catch (e) {
    console.log("Error", e);
  }
}
run();
