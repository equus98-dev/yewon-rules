const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dirs = [
  path.join(__dirname, '../public/attachments'),
  path.join(__dirname, '../public/rules')
];

let totalConverted = 0;
let totalSkipped = 0;
let totalErrors = 0;

for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.toLowerCase().endsWith('.hwp')) {
      const pdfName = file.slice(0, -4) + '.pdf';
      const pdfPath = path.join(dir, pdfName);
      const hwpPath = path.join(dir, file);
      
      let shouldConvert = true;
      if (fs.existsSync(pdfPath)) {
        const stats = fs.statSync(pdfPath);
        if (stats.size > 6000) {
          shouldConvert = false; // It's a real PDF
        }
      }
      
      if (!shouldConvert) {
        totalSkipped++;
        continue;
      }
      
      console.log(`Converting: ${file}...`);
      try {
        const output = execSync(`powershell -ExecutionPolicy Bypass -File scripts\\convert_single.ps1 "${hwpPath}" "${pdfPath}"`, { encoding: 'utf-8' });
        console.log(`  -> ${output.trim()}`);
        if (output.includes("Success")) {
          totalConverted++;
          // Wait 500ms to let Hancom Office close properly
          execSync('powershell -Command "Start-Sleep -Milliseconds 500"');
        } else {
          totalErrors++;
        }
      } catch (err) {
        console.error(`  -> Failed: ${err.message}`);
        totalErrors++;
      }
    }
  }
}

console.log(`Finished. Converted: ${totalConverted}, Skipped: ${totalSkipped}, Errors: ${totalErrors}`);
