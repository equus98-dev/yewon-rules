const fs = require('fs');
const { execSync } = require('child_process');

const ATTACHMENT_PATTERN = /^[\[〔【<]\s*(별표|별지|서식|별첨)/;

async function run() {
  console.log('Fetching D1 data...');
  const jsonStr = execSync('npx wrangler d1 execute yewon-rules-db --remote --command="SELECT id, articleNumber, title, contentJson FROM Article WHERE contentJson IS NOT NULL AND contentJson != \'[]\' AND contentJson != \'\'" --json', { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 50 });
  const data = JSON.parse(jsonStr);
  const articles = data[0].results;

  console.log(`총 ${articles.length}개 article 검사 중...`);
  
  const toFix = [];
  
  for (const art of articles) {
    let items;
    try {
      items = JSON.parse(art.contentJson);
    } catch {
      continue;
    }
    
    if (!Array.isArray(items) || items.length === 0) continue;
    
    let cutIdx = -1;
    for (let i = 0; i < items.length; i++) {
      const itemText = String(items[i].text || '').trim();
      if (ATTACHMENT_PATTERN.test(itemText)) {
        cutIdx = i;
        break;
      }
    }
    
    if (cutIdx === -1) continue;
    
    toFix.push({
      id: art.id,
      title: art.title,
      originalLength: items.length,
      cleanedLength: cutIdx,
      removedFrom: items[cutIdx]?.text?.substring(0, 60),
      cleanedItems: items.slice(0, cutIdx),
    });
  }
  
  console.log(`\n찌꺼기 발견: ${toFix.length}개 article`);
  
  let sqls = [];
  for (const f of toFix) {
    console.log(`  - [${f.title}] ${f.originalLength}→${f.cleanedLength}개 (제거 시작: "${f.removedFrom}")`);
    const newJson = JSON.stringify(f.cleanedItems).replace(/'/g, "''"); // escape single quotes
    sqls.push(`UPDATE "Article" SET "contentJson" = '${newJson}' WHERE id = '${f.id}';`);
  }

  if (sqls.length > 0) {
    fs.writeFileSync('fix_garbage.sql', sqls.join('\n'), 'utf-8');
    console.log(`\n✅ fix_garbage.sql 생성 완료! (총 ${sqls.length}개 쿼리)`);
    console.log(`적용하려면: npx wrangler d1 execute yewon-rules-db --remote --file=fix_garbage.sql`);
  } else {
    console.log(`\n수정할 데이터가 없습니다.`);
  }
}

run().catch(console.error);
