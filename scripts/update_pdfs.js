const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

function runQuery(query) {
  const result = execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --command="${query}" --json`, { encoding: 'utf-8' });
  return JSON.parse(result)[0].results;
}

const sourcePdfDir = path.join(__dirname, '../docs/rules/별지 및 별표 모음/PDF');
const targetAttDir = path.join(__dirname, '../public/attachments');

console.log("Copying PDFs to public/attachments...");
const pdfFiles = fs.readdirSync(sourcePdfDir);
let copyCount = 0;
for (const pdfFile of pdfFiles) {
  if (pdfFile.toLowerCase().endsWith('.pdf')) {
    fs.copyFileSync(path.join(sourcePdfDir, pdfFile), path.join(targetAttDir, pdfFile));
    copyCount++;
  }
}
console.log(`Copied ${copyCount} PDF files.`);

console.log("Fetching attachments from DB...");
const attachments = runQuery(`SELECT * FROM Attachment;`);

const hwps = attachments.filter(a => a.fileType === 'HWP' || a.title.toLowerCase().endsWith('.hwp'));
const pdfs = attachments.filter(a => a.fileType === 'PDF' || a.title.toLowerCase().endsWith('.pdf'));

let updates = [];
let inserts = [];

for (const hwp of hwps) {
  const baseTitle = hwp.title.replace(/\.hwp$/i, '');
  const pdfTitle = baseTitle + '.pdf';
  
  const cleanName = baseTitle.replace(/^\[(전문|별표|별지)\]\s*/, '');
  const localName = cleanName + '.pdf';
  const attPath = path.join(targetAttDir, localName);
  
  if (fs.existsSync(attPath)) {
    const stats = fs.statSync(attPath);
    const existingPdf = pdfs.find(p => p.ruleId === hwp.ruleId && p.title === pdfTitle);
    
    if (existingPdf) {
      if (existingPdf.fileSize !== stats.size) {
        updates.push(`UPDATE Attachment SET "fileSize" = ${stats.size}, "updatedAt" = CURRENT_TIMESTAMP WHERE id = '${existingPdf.id}';`);
      }
    } else {
      const newId = crypto.randomUUID();
      const safeTitle = pdfTitle.replace(/'/g, "''");
      const fileUrl = '/attachments/' + encodeURIComponent(localName);
      inserts.push(`INSERT INTO Attachment (id, "ruleId", title, "fileUrl", "fileSize", "fileType", "createdAt", "updatedAt") VALUES ('${newId}', '${hwp.ruleId}', '${safeTitle}', '${fileUrl}', ${stats.size}, 'PDF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`);
    }
  }
}

console.log(`Found ${updates.length} updates and ${inserts.length} inserts.`);

const allSql = [...updates, ...inserts];
if (allSql.length > 0) {
  fs.writeFileSync('scripts/update_pdfs_temp.sql', allSql.join('\n'));
  console.log("Executing SQL...");
  execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --file=scripts/update_pdfs_temp.sql`, { stdio: 'inherit' });
  console.log("Database successfully updated!");
} else {
  console.log("No DB changes required.");
}
