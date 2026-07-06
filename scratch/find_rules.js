const fs = require('fs');

try {
    let jsonStr = fs.readFileSync('f:\\예원예술대학교_규정관리시스템\\dump.json', 'utf16le');
    
    // Strip BOM
    if (jsonStr.charCodeAt(0) === 0xFEFF || jsonStr.charCodeAt(0) === 0xFFFE) {
        jsonStr = jsonStr.slice(1);
    }
    
    const parsed = JSON.parse(jsonStr);
    
    let output = '';
    
    if (Array.isArray(parsed)) {
        for (const item of parsed) {
            if (item.title && (item.title.includes('직제 규정') || item.title.includes('사무분장 규정'))) {
                output += JSON.stringify(item, null, 2) + '\n\n';
            }
        }
    } else if (parsed.results) { // D1 dump format
        // Handle D1 format
        for (const table of Object.keys(parsed)) {
             output += table + '\n';
        }
    } else {
         output += Object.keys(parsed).join('\n');
    }
    
    fs.writeFileSync('f:\\예원예술대학교_규정관리시스템\\scratch\\rules_out.txt', output, 'utf8');
    console.log('Success');
} catch(e) {
    console.error(e);
}
