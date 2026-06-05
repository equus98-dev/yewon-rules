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

const routes = walkDir(path.join(__dirname, 'src', 'app', 'api'));
for (const route of routes) {
  const content = fs.readFileSync(route, 'utf-8');
  if (!content.includes('export const runtime')) {
    fs.writeFileSync(route, 'export const runtime = "edge";\n' + content, 'utf-8');
    console.log(`Added runtime edge to ${route}`);
  }
}
