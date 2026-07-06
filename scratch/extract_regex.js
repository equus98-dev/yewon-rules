const fs = require('fs');

let buf = fs.readFileSync('f:\\예원예술대학교_규정관리시스템\\dump.json');
let str = buf.toString('utf16le');
if (str.charCodeAt(0) === 0xFEFF || str.charCodeAt(0) === 0xFFFE) {
    str = str.slice(1);
}

const regex = /"title"\s*:\s*"([^"]+)",\s*"contentText"\s*:\s*"([^"]+)"/g;
let match;
let out = '';

while ((match = regex.exec(str)) !== null) {
    const title = match[1];
    let content = match[2];
    
    // Unescape common JSON escapes
    content = content.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\t/g, '\t');
    
    out += `=== [ ${title} ] ===\n${content}\n\n`;
}

fs.writeFileSync('f:\\예원예술대학교_규정관리시스템\\scratch\\regs.txt', out, 'utf8');
console.log('Extracted using regex!');
