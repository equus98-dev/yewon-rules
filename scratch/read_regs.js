const fs = require('fs');
try {
    const Database = require('better-sqlite3');
    const db = new Database('f:\\예원예술대학교_규정관리시스템\\dev.db');
    const rows = db.prepare(`
        SELECT R.title, A.articleNumber, A.title as aTitle, A.contentText 
        FROM Rule R 
        JOIN Revision RV ON R.id = RV.ruleId 
        JOIN Article A ON RV.id = A.revisionId 
        WHERE R.title LIKE '%직제 규정%' OR R.title LIKE '%사무분장 규정%' 
        ORDER BY R.title, A.articleNumber
    `).all();

    let output = '';
    for (const r of rows) {
        output += `[${r.title}] 제${r.articleNumber}조(${r.aTitle})\n${r.contentText}\n\n`;
    }
    fs.writeFileSync('f:\\예원예술대학교_규정관리시스템\\regs_output.txt', output, 'utf8');
    console.log('Done');
} catch(e) {
    console.error(e);
}
