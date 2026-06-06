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
  let newContent = content;

  // We want to replace `await something.json()` with `(await something.json()) as any`
  // but only if it's not already wrapped in `(... as any)` or `(... as any[])`
  // We can do a simpler replace and then clean up any double wraps.
  
  newContent = newContent.replace(/await\s+([a-zA-Z0-9_]+)\.json\(\)/g, '(await $1.json()) as any');
  
  // Cleanup duplicates that might have been caused by running the replace again:
  // e.g. `((await res.json()) as any) as any` -> `(await res.json()) as any`
  newContent = newContent.replace(/\(\(await ([a-zA-Z0-9_]+)\.json\(\)\) as any\)( as any\[\]| as any)+/g, '(await $1.json())$2');
  newContent = newContent.replace(/\(\(await ([a-zA-Z0-9_]+)\.json\(\)\) as any\[\]\)( as any\[\]| as any)+/g, '(await $1.json()) as any[]');

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf-8');
    console.log(`Fixed references in ${file}`);
    count++;
  }
}
console.log(`Done. Fixed ${count} files.`);
