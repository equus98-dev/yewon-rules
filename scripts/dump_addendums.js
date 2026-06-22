const fs = require('fs');

const data = JSON.parse(fs.readFileSync('docs/202_addendums_full.json', 'utf8'));
const articles = data[0].results;

// Filter only addendums
const addendums = articles.filter(a => a.articleTitle && a.articleTitle.startsWith('부칙'));

// Sort them by articleNumber or createdAt (we will try to sort by articleNumber to keep them in order)
addendums.sort((a, b) => a.articleNumber - b.articleNumber);

let out = '';
for (const a of addendums) {
    out += `--- [ID: ${a.id} | articleNumber: ${a.articleNumber}] ---\n`;
    out += a.contentText + '\n\n';
}

fs.writeFileSync('docs/202_addendums_dump.txt', out);
console.log(`Dumped ${addendums.length} addendums to docs/202_addendums_dump.txt`);
