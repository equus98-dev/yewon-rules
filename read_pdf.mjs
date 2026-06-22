import fs from 'fs';
import pdf from 'pdf-parse';

async function main() {
  const dataBuffer = fs.readFileSync('E:/예원예술대학교_규정관리시스템/docs/rules/규정전문 PDF/5-1-1 학생생활관 규정.pdf');
  const data = await pdf(dataBuffer);
  fs.writeFileSync('temp_pdf.txt', data.text, 'utf8');
  console.log('Done writing PDF text');
}

main();
