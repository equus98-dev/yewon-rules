const fs = require('fs');

function cleanAndParse(file, isUtf16 = false) {
    let raw = fs.readFileSync(file);
    let str = isUtf16 ? raw.toString('utf16le') : raw.toString('utf8');
    
    // remove BOM
    if (str.charCodeAt(0) === 0xFEFF || str.charCodeAt(0) === 0xFFFE) {
        str = str.slice(1);
    }
    // remove control characters except newline, tab, and carriage return
    str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
    
    try {
        return JSON.parse(str);
    } catch(e) {
        console.error("Failed to parse " + file, e.message);
        return null;
    }
}

let out = '';
const samu = cleanAndParse('f:\\예원예술대학교_규정관리시스템\\samu_current.json', true);
if (samu && samu.results) {
    out += "=== 사무분장 규정 ===\n";
    for(const a of samu.results) {
        out += `제${a.articleNumber}조(${a.title})\n${a.contentText}\n\n`;
    }
} else {
    out += "Failed to read samu_current.json\n";
}

const rule2 = cleanAndParse('f:\\예원예술대학교_규정관리시스템\\rule2.json', true);
if (rule2 && rule2.results) {
    out += "=== rule2.json ===\n";
    for(const a of rule2.results) {
        out += `제${a.articleNumber}조(${a.title})\n${a.contentText}\n\n`;
    }
}

fs.writeFileSync('f:\\예원예술대학교_규정관리시스템\\scratch\\out.txt', out, 'utf8');
console.log('Done');
