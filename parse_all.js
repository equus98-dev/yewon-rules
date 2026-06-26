const fs = require('fs');
const path = require('path');

// 1. Convert current_3_1_21.json (UTF-16LE) to UTF-8
try {
    let raw = fs.readFileSync('current_3_1_21.json');
    let str = "";
    if (raw[0] === 0xFF && raw[1] === 0xFE) {
        str = raw.toString('utf16le');
    } else {
        str = raw.toString('utf-8');
    }
    fs.writeFileSync('current_3_1_21_utf8.json', str, 'utf-8');
    console.log("Successfully converted current_3_1_21.json to utf8");
    const data = JSON.parse(str)[0].results;
    console.log(`Total articles in D1: ${data.length}`);
    data.forEach(a => {
        console.log(`Art ${a.articleNumber} [${a.title}] | chapter: ${a.chapter} | sortOrder: ${a.sortOrder}`);
    });
} catch(e) {
    console.error("Error reading current_3_1_21.json:", e.message);
}

// 2. Parse HWPX section0.xml
try {
    const xmlPath = path.join(__dirname, 'temp_hwpx_dir', 'Contents', 'section0.xml');
    if (fs.existsSync(xmlPath)) {
        const xml = fs.readFileSync(xmlPath, 'utf-8');
        // Extract paragraphs <hp:p ...> ... </hp:p>
        const pRegex = /<hp:p[^>]*>(.*?)<\/hp:p>/gs;
        const tRegex = /<hp:t[^>]*>(.*?)<\/hp:t>/gs;
        let match;
        const lines = [];
        while ((match = pRegex.exec(xml)) !== null) {
            const pContent = match[1];
            let tMatch;
            let pText = "";
            while ((tMatch = tRegex.exec(pContent)) !== null) {
                pText += tMatch[1];
            }
            if (pText.trim()) {
                lines.push(pText);
            }
        }
        fs.writeFileSync('hwpx_text.txt', lines.join('\n'), 'utf-8');
        console.log("Successfully extracted text from HWPX to hwpx_text.txt");
    } else {
        console.log("section0.xml not found at " + xmlPath);
    }
} catch(e) {
    console.error("Error parsing HWPX XML:", e.message);
}
