const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      searchDir(full);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('시행') || content.includes('제정') || content.includes('effectiveDate')) {
        console.log(`Found in ${full}:`);
        const lines = content.split('\n');
        lines.forEach((l, idx) => {
          if (l.includes('시행') || l.includes('제정') || l.includes('effectiveDate')) {
            console.log(`  L${idx+1}: ${l.trim()}`);
          }
        });
      }
    }
  });
}

searchDir('./src');



