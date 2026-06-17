const fs = require('fs');
const { execSync } = require('child_process');

async function run() {
  console.log("Fetching 1-0-1 Addendum articles...");
  const fetchCmd = `npx wrangler d1 execute yewon-rules-db --remote --command="SELECT id, articleNumber, contentText FROM Article WHERE revisionId IN (SELECT id FROM Revision WHERE ruleId = (SELECT id FROM Rule WHERE ruleNumber = '1-0-1')) AND articleNumber >= 8000 AND articleNumber < 9000" --json`;
  
  const output = execSync(fetchCmd).toString();
  
  const lines = output.split('\n');
  let jsonStr = '';
  let capture = false;
  for (const line of lines) {
    if (line.trim().startsWith('[')) capture = true;
    if (capture) jsonStr += line + '\n';
  }
  
  // Try parsing the json output
  let rows = [];
  try {
     const parsed = JSON.parse(jsonStr);
     rows = parsed[0].results;
  } catch (e) {
     console.error("Failed to parse JSON", e);
     console.log(jsonStr);
     return;
  }
  
  const updateQueries = [];
  
  for (const row of rows) {
    let text = row.contentText;
    if (!text) continue;
    
    // 1. 찌꺼기 텍스트 제거 (별표, 교육용 기본재산 등)
    const garbageIdx1 = text.search(/「?\s*별\s*표\s*1\s*」?/);
    if (garbageIdx1 !== -1) text = text.substring(0, garbageIdx1).trim();
    
    const garbageIdx2 = text.search(/「?\s*별\s*표\s*2\s*」?/);
    if (garbageIdx2 !== -1) text = text.substring(0, garbageIdx2).trim();

    const garbageIdx3 = text.search(/교육용 기본재산 확보내역/);
    if (garbageIdx3 !== -1) text = text.substring(0, garbageIdx3).trim();
    
    // 2. contentHtml 생성 (엔터가 안쳐지는 문제 해결)
    // 괄호 (시행일) 등 앞에서 무조건 엔터 치도록 정규화
    text = text.replace(/([^\n])\s*(\((?:시행일|임원|감사|계약제|교직원|일반직원|교원|징계)[^)]*\))/g, '$1\n$2');
    
    const paragraphs = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const htmlLines = paragraphs.map(l => `<p>${l}</p>`);
    const newHtml = htmlLines.join('');
    
    // 3. contentJson 재구성
    const newJson = JSON.stringify({ paragraphs: paragraphs });
    
    // Escape single quotes for SQL
    const safeHtml = newHtml.replace(/'/g, "''");
    const safeJson = newJson.replace(/'/g, "''");
    const safeText = text.replace(/'/g, "''");
    
    const query = `UPDATE Article SET contentText = '${safeText}', contentHtml = '${safeHtml}', contentJson = '${safeJson}' WHERE id = '${row.id}';`;
    updateQueries.push(query);
  }
  
  fs.writeFileSync('scripts/fix_101.sql', updateQueries.join('\n'));
  console.log("SQL file generated at scripts/fix_101.sql");
}

run();
