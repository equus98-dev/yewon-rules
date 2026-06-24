const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('docs/rules/규정전문 PDF/2-0-2 예원예술대학교 학칙.pdf');

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('docs/202_pdf_extracted.txt', data.text);
    console.log('PDF text extracted to docs/202_pdf_extracted.txt');
}).catch(function(error) {
    console.error(error);
});
