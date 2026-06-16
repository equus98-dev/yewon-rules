const Database = require('better-sqlite3');
const db = new Database('dev.db');

const ATTACHMENT_PATTERN = /^[\[〔【<]\s*(별표|별지|서식|별첨)/;

async function run() {
  const execute = process.argv[2] === '--execute';
  
  // contentJson이 있는 모든 Article 가져오기
  const articles = db.prepare(`
    SELECT id, articleNumber, title, contentJson
    FROM Article
    WHERE contentJson IS NOT NULL AND contentJson != ''
  `).all();

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
    
    // [별표], [별지] 등으로 시작하는 아이템의 첫 번째 인덱스 찾기
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
  for (const f of toFix) {
    console.log(`  - [${f.title}] ${f.originalLength}→${f.cleanedLength}개 (제거 시작: "${f.removedFrom}")`);
  }
  
  if (execute) {
    console.log('\n실제 DB 업데이트 중...');
    let count = 0;
    for (const f of toFix) {
      db.prepare(`UPDATE Article SET contentJson = ? WHERE id = ?`)
        .run(JSON.stringify(f.cleanedItems), f.id);
      count++;
      if (count % 10 === 0) console.log(`  ${count}/${toFix.length} 완료`);
    }
    console.log(`\n✅ ${count}개 article 정리 완료!`);
  } else {
    console.log('\n(드라이런 완료 - 실제 적용하려면 --execute 옵션 사용)');
  }
}

run().catch(console.error).finally(() => db.close());
