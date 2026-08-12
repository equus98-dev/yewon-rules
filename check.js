const { Client } = require('pg');

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

// 1. fix_scholarship.sql 마이그레이션
const sqlPath = path.join(__dirname, 'fix_scholarship.sql');
let sqlContent = fs.readFileSync(sqlPath, 'utf8');

// contentJson = '[...]' 패턴 매칭
// contentJson = ' 뒤에 나오는 JSON을 안전하게 추출하기 위해 정규식 사용
const jsonRegex = /contentJson\s*=\s*'(\[\s*\{[\s\S]*?\}\s*\])'\s*WHERE\s*articleNumber\s*=\s*19/i;
const match = sqlContent.match(jsonRegex);

if (match) {
  const origJsonStr = match[1];
  // SQL 문자열 이스케이프 해제 ('' -> ')
  const rawJsonStr = origJsonStr.replace(/''/g, "'");
  const jsonArr = JSON.parse(rawJsonStr);
  
  // 타입 마이그레이션 적용
  const migratedArr = jsonArr.map(item => {
    const text = item.text || "";
    let type = item.type;
    if (/^\d{1,2}(?:의\d+)?\./.test(text.trim())) {
      type = "item";
    } else if (/^[가-하]\./.test(text.trim()) || /^\d+종/.test(text.trim())) {
      type = "subitem";
    } else {
      type = "paragraph";
    }
    return { ...item, type };
  });
  
  const newJsonStr = JSON.stringify(migratedArr, null, 0);
  // 다시 SQL 문자열로 이스케이프 (' -> '')
  const escapedNewJsonStr = newJsonStr.replace(/'/g, "''");
  
  // 파일 내용 교체
  sqlContent = sqlContent.replace(origJsonStr, escapedNewJsonStr);
  fs.writeFileSync(sqlPath, sqlContent, 'utf8');
  console.log("SUCCESS: fix_scholarship.sql migrated successfully!");
} else {
  console.error("ERROR: Could not find Article 19 contentJson in fix_scholarship.sql");
}

// 2. 로컬 SQLite DB 업데이트 (Article 테이블이 존재하는 경우에만)
const sqlitePaths = [
  '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/3f0d7354033b57c6e770914eb671715dd9e9a1047e83797474477a6baeecbb43.sqlite',
  'dev.db',
  'database.sqlite'
];

for (const dbPath of sqlitePaths) {
  if (fs.existsSync(dbPath)) {
    try {
      const db = new DatabaseSync(dbPath);
      // Article 테이블 존재 여부 확인
      const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='Article'").get();
      if (tableCheck) {
        const rows = db.prepare("SELECT id, contentJson FROM Article WHERE articleNumber = 19").all();
        if (rows.length > 0) {
          console.log(`Updating ${rows.length} articles in ${dbPath}...`);
          const stmt = db.prepare("UPDATE Article SET contentJson = ? WHERE id = ?");
          for (const row of rows) {
            const origJson = JSON.parse(row.contentJson);
            const migrated = origJson.map(item => {
              const text = item.text || "";
              let type = item.type;
              if (/^\d{1,2}(?:의\d+)?\./.test(text.trim())) {
                type = "item";
              } else if (/^[가-하]\./.test(text.trim()) || /^\d+종/.test(text.trim())) {
                type = "subitem";
              } else {
                type = "paragraph";
              }
              return { ...item, type };
            });
            stmt.run(JSON.stringify(migrated), row.id);
          }
          console.log(`SUCCESS: ${dbPath} updated successfully!`);
        }
      }
    } catch (e) {
      console.warn(`WARNING: Failed to update ${dbPath}:`, e.message);
    }
  }
}








