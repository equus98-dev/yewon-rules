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
    } else if (file.endsWith('route.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walkDir(path.join(__dirname, 'src', 'app', 'api'));
for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  if (!content.includes('export const runtime = "edge";')) {
    content = 'export const runtime = "edge";\n\n' + content;
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Added edge runtime to ${file}`);
  }
}
