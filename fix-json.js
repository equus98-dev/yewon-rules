const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walkDir(path.join(__dirname, 'src'));
let count = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  if (content.includes('await res.json()')) {
    // Also catch cases where it's assigned to a variable
    content = content.replace(/await res\.json\(\)/g, '(await res.json()) as any');
    // Clean up if we already replaced it in a previous fix
    content = content.replace(/\(\(await res\.json\(\)\) as any\) as any\[\]/g, '(await res.json()) as any[]');
    content = content.replace(/\(\(await res\.json\(\)\) as any\) as any/g, '(await res.json()) as any');
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Fixed references in ${file}`);
    count++;
  }
}
console.log(`Done. Fixed ${count} files.`);
