import fs from 'fs';

async function run() {
  const searchUrl = `https://yewon-rules.pages.dev/api/rules/search?query=${encodeURIComponent("대학원 학칙")}&options=title`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  
  const rule = searchData.titleMatches.find(r => r.title === "대학원 학칙");
  
  const ruleUrl = `https://yewon-rules.pages.dev/api/rules/${rule.id}`;
  const ruleRes = await fetch(ruleUrl);
  const ruleData = await ruleRes.json();
  
  const articles = ruleData.currentRevision.articles.filter(a => a.articleNumber >= 8000 && a.articleNumber < 9000).sort((a,b)=>a.articleNumber - b.articleNumber);
  
  let currentAddendum = null;
  let toUpdate = [];
  let toDelete = [];
  
  for (const art of articles) {
    const text = String(art.contentText || "").trim();
    const isAddendumHeader = /^부\s*칙/.test(text);
    
    if (isAddendumHeader) {
      if (currentAddendum) {
        toUpdate.push(currentAddendum);
      }
      currentAddendum = {
        id: art.id,
        articleNumber: art.articleNumber,
        mergedText: text
      };
    } else if (currentAddendum && /^제\d+조/.test(text)) {
      currentAddendum.mergedText += "\n" + text;
      toDelete.push(art.id);
    } else if (!currentAddendum) {
      currentAddendum = {
        id: art.id,
        articleNumber: art.articleNumber,
        mergedText: text
      };
    } else {
       currentAddendum.mergedText += "\n" + text;
       toDelete.push(art.id);
    }
  }
  
  if (currentAddendum) {
    toUpdate.push(currentAddendum);
  }
  
  let sql = '';
  
  for (const upd of toUpdate) {
    const paragraphs = upd.mergedText.split("\n").filter(l => l.trim().length > 0);
    const contentJson = paragraphs.map(p => {
      if (/^제\d+조/.test(p.trim())) return { type: "paragraph", text: p.trim() };
      return { type: "article", text: p.trim() };
    });
    const cJsonStr = JSON.stringify(contentJson);
    const safeText = upd.mergedText.replace(/'/g, "''");
    const safeJsonStr = cJsonStr.replace(/'/g, "''");
    sql += `UPDATE Article SET contentText = '${safeText}', contentJson = '${safeJsonStr}', title = '부칙', chapter = '부칙' WHERE id = '${upd.id}';\n`;
  }
  
  for (const delId of toDelete) {
    sql += `DELETE FROM Article WHERE id = '${delId}';\n`;
  }
  
  fs.writeFileSync('fix.sql', sql);
  console.log("Wrote fix.sql");
}
run();
