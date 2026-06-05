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

const files = walkDir(path.join(__dirname, 'src', 'app'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  if (content.includes('Promise<{ params: Promise<{')) {
    content = content.replace(/Promise<\{\s*params:\s*Promise<\{\s*([^}]+)\s*\}\>\s*\}\>/g, 'Promise<{ $1 }>');
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Fixed promise in ${file}`);
  }
}
