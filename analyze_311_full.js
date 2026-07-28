// 직제 규정 API 데이터 전체 분석 - 13조, 19조, 23조 등 상세 확인
const fs = require('fs');

const rawContent = fs.readFileSync(String.raw`C:\Users\윈도우11\.gemini\antigravity\brain\f54b6186-7b02-47cb-b400-96b09f009470\.system_generated\steps\112\content.md`, 'utf8');
const jsonPart = rawContent.split('---')[1].trim();
const data = JSON.parse(jsonPart);

const articles = data.currentRevision.articles;

// 모든 조항 목록 출력
console.log('=== 전체 조항 목록 ===');
articles.forEach(a => {
  console.log(`  [${a.articleNumber}] "${a.title}" sortOrder=${a.sortOrder}`);
  console.log(`    contentText: ${(a.contentText || '').substring(0, 100)}`);
  console.log('');
});
