const fs = require('fs');
const content = fs.readFileSync('src/components/ArticleRenderer.tsx', 'utf-8');
const lines = content.split('\n');
console.log(`Total lines: ${lines.length}`);
for (let i = 925; i < 940; i++) {
    console.log(`Line ${i+1}: ${JSON.stringify(lines[i])}`);
}
