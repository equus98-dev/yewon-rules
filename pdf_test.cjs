const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync("docs/rules/규정전문 PDF/5-1-2 학생생활관 관생생활 수칙.pdf");
pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('512_pdf.txt', data.text);
    console.log("Done");
});
