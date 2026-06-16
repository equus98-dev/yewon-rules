const fs = require('fs');

async function fetchRule() {
  const res = await fetch('https://yewon-rules.pages.dev/api/rules/22b95ab7-ade2-4881-bb4e-ed8fd24a0467');
  const fullRule = await res.json();
  
  const lastRevision = fullRule.currentRevision;
  const addendums = lastRevision.articles.filter(a => a.chapter && a.chapter.includes('부칙') || a.title && a.title.includes('부칙') || (!a.chapter && !a.title && a.contentText && a.contentText.includes('부칙')));
  
  fs.writeFileSync('scripts/debug_out.json', JSON.stringify(addendums.slice(-5), null, 2));
}

fetchRule();
