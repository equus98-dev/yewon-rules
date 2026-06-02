async function run() {
  const res = await fetch('https://yewon-rules.pages.dev/api/rules/b45e669f-0247-4098-aec4-59bb1848b0cf');
  const data = await res.json();
  
  if (data.error) {
    console.error("API returned error:", data);
    return;
  }
  
  const currentRevision = data.currentRevision;
  if (!currentRevision || !currentRevision.articles) {
    console.log("No articles found");
    return;
  }
  
  console.log(`Found ${currentRevision.articles.length} articles`);
  
  for (const article of currentRevision.articles) {
    let contentJson = article.contentJson;
    let items = [];
    
    try {
      let parsed = contentJson;
      if (typeof contentJson === "string") {
        parsed = JSON.parse(contentJson);
      }
      
      if (Array.isArray(parsed)) {
        items = parsed;
      } else if (parsed && typeof parsed === "object") {
        if (Array.isArray(parsed.paragraphs)) {
          items = parsed.paragraphs.map(p => ({ type: "paragraph", num: "", text: String(p) }));
        } else {
          items = [];
        }
      }
    } catch (e) {
      console.error(`Article ${article.id} failed to parse contentJson:`, e);
    }
    
    if (!Array.isArray(items)) {
      items = [];
    }
    
    // Simulate mapping
    items.forEach((item, index) => {
      if (!item || typeof item !== 'object') return;
      const safeNum = item.num !== null && item.num !== undefined ? String(item.num) : "";
      const safeText = item.text !== null && item.text !== undefined ? String(item.text) : "";
      
      // try matching regex
      if (item.type === "text" && typeof item.text === "string" && item.text.match(/\d-\d-\d-/)) {
        // do nothing
      }
    });
  }
  
  console.log("Client-side simulation finished without crashing.");
}

run();
