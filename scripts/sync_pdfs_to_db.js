const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

function runQuery(query) {
  const result = execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --command="${query}" --json`, { encoding: 'utf-8' });
  return JSON.parse(result)[0].results;
}

try {
  console.log("Fetching attachments from DB...");
  const attachments = runQuery(`SELECT * FROM Attachment;`);
  
  const hwps = attachments.filter(a => a.fileType === 'HWP' || a.title.toLowerCase().endsWith('.hwp'));
  const pdfs = attachments.filter(a => a.fileType === 'PDF' || a.title.toLowerCase().endsWith('.pdf'));

  console.log(`Found ${hwps.length} HWP attachments and ${pdfs.length} PDF attachments.`);

  let newPdfInserts = [];

  for (const hwp of hwps) {
    const baseTitle = hwp.title.replace(/\.hwp$/i, '');
    const pdfTitle = baseTitle + '.pdf';
    
    // Check if this rule already has this PDF
    const exists = pdfs.some(p => p.ruleId === hwp.ruleId && p.title === pdfTitle);
    
    if (!exists) {
      // Check if PDF exists locally
      // The fileUrl might be /attachments/... or /rules/... or /api/files/...
      // If it's /api/files/ it means it was manually uploaded.
      // We only care about matching local files in public/attachments or public/rules.
      let localPath = null;
      let fileUrl = null;
      
      const cleanName = baseTitle.replace(/^\[(전문|별표|별지)\]\s*/, '');
      const localName = cleanName + '.pdf';
      
      const attPath = path.join(__dirname, '../public/attachments', localName);
      const rulePath = path.join(__dirname, '../public/rules', localName);
      
      if (fs.existsSync(attPath)) {
        localPath = attPath;
        fileUrl = '/attachments/' + encodeURIComponent(localName);
      } else if (fs.existsSync(rulePath)) {
        localPath = rulePath;
        fileUrl = '/rules/' + encodeURIComponent(localName);
      }
      
      if (localPath) {
        const stats = fs.statSync(localPath);
        const newId = crypto.randomUUID();
        const safeTitle = pdfTitle.replace(/'/g, "''");
        
        newPdfInserts.push(`INSERT INTO Attachment (id, "ruleId", title, "fileUrl", "fileSize", "fileType", "createdAt", "updatedAt") VALUES ('${newId}', '${hwp.ruleId}', '${safeTitle}', '${fileUrl}', ${stats.size}, 'PDF', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`);
      }
    }
  }

  console.log(`Found ${newPdfInserts.length} new PDFs to insert into DB.`);

  if (newPdfInserts.length > 0) {
    const sqlFileContent = newPdfInserts.join('\n');
    fs.writeFileSync('scripts/insert_pdfs.sql', sqlFileContent);
    console.log("Wrote SQL to scripts/insert_pdfs.sql");

    console.log("Executing SQL...");
    execSync(`npx.cmd wrangler d1 execute yewon-rules-db --remote --file=scripts/insert_pdfs.sql`, { stdio: 'inherit' });
    console.log("Database successfully updated!");
  } else {
    console.log("No new PDFs to insert.");
  }
} catch (e) {
  console.error("Error:", e);
}
