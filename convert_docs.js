const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sourceDir = "F:\\예원예술대학교_규정관리시스템\\docs\\rules\\별지 및 별표 모음";
const targetDir = path.join(sourceDir, "PDF");

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

let totalConverted = 0;
let totalSkipped = 0;
let totalErrors = 0;

if (fs.existsSync(sourceDir)) {
  const files = fs.readdirSync(sourceDir);
  const hwpFiles = files.filter(f => f.toLowerCase().endsWith('.hwp'));
  console.log(`Found ${hwpFiles.length} HWP files to convert.`);
  
  for (const file of hwpFiles) {
    const pdfName = file.slice(0, -4) + '.pdf';
    const pdfPath = path.join(targetDir, pdfName);
    const hwpPath = path.join(sourceDir, file);
    
    if (fs.existsSync(pdfPath)) {
      const stats = fs.statSync(pdfPath);
      if (stats.size > 0) {
        totalSkipped++;
        continue;
      }
    }
    
    console.log(`Converting: ${file}...`);
    try {
      const output = execSync(`powershell -ExecutionPolicy Bypass -File scripts\\convert_single.ps1 "${hwpPath}" "${pdfPath}"`, { encoding: 'utf-8' });
      console.log(`  -> ${output.trim()}`);
      if (output.includes("Success")) {
        totalConverted++;
      } else {
        totalErrors++;
      }
    } catch (err) {
      console.error(`  -> Failed: ${err.message}`);
      totalErrors++;
    }
  }
}

console.log(`Finished. Converted: ${totalConverted}, Skipped: ${totalSkipped}, Errors: ${totalErrors}`);
