const fs = require('fs');
const pdfParse = require('pdf-parse');
const Database = require('better-sqlite3');

async function main() {
    try {
        const db = new Database('dev.db');
        const rules = db.prepare(`SELECT id, ruleNumber, title FROM Rule`).all();
        fs.writeFileSync('temp_rules.json', JSON.stringify(rules, null, 2), 'utf8');
        console.log(`Exported ${rules.length} rules to temp_rules.json`);

        const pdfPath = 'E:/예원예술대학교_규정관리시스템/docs/rules/규정전문 PDF/5-1-1 학생생활관 규정.pdf';
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdfParse(dataBuffer);
        fs.writeFileSync('temp_pdf.txt', data.text, 'utf8');
        console.log("Exported PDF text to temp_pdf.txt");
    } catch (error) {
        console.error(error);
    }
}

main();
