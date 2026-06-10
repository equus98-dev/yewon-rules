const fs = require('fs');

async function check() {
  const rulesRes = await fetch("https://yewon-rules.pages.dev/api/admin/rules");
  const rules = await rulesRes.json();
  const rule1 = rules.find(r => r.title.includes("사회복지대학원 학사운영 규정"));
  const rule2 = rules.find(r => r.title.includes("일반대학원 학사운영 규정"));
  
  let out = '';
  if (rule1) {
    const res = await fetch(`https://yewon-rules.pages.dev/api/rules/${rule1.id}`);
    const data = await res.json();
    const arts = data.currentRevision.articles.filter(a => a.articleNumber === 43 || a.articleNumber === 78 || a.articleNumber >= 9000);
    out += "사회복지대학원:\n" + JSON.stringify(arts, null, 2) + "\n\n";
  }
  
  if (rule2) {
    const res = await fetch(`https://yewon-rules.pages.dev/api/rules/${rule2.id}`);
    const data = await res.json();
    const arts = data.currentRevision.articles.filter(a => a.contentHtml && a.contentHtml.includes("제6학기"));
    out += "일반대학원:\n" + JSON.stringify(arts, null, 2);
  }

  fs.writeFileSync('welfare_out3.txt', out, 'utf8');
}
check();
