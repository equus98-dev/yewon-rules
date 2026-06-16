const fs = require('fs');
const content = fs.readFileSync('src/components/ArticleRenderer.tsx', 'utf-8');
const idx = content.indexOf('if (isAddendumArticle) {\r\n    // ── 1.');
const lines = content.split('\n');
let lineNo = 0, charCount = 0;
for (let i = 0; i < lines.length; i++) {
    charCount += lines[i].length + 1;
    if (charCount > idx) { lineNo = i+1; break; }
}
console.log(`Block at line: ${lineNo}`);
// show lines around it
for (let i = lineNo-1; i < lineNo+20; i++) {
    console.log(`Line ${i+1}: ${lines[i]}`);
}
