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
  let content = fs.readFileSync(route, 'utf-8');
  if (content.includes('status: 500')) {
    content = content.replace(/status:\s*500/g, 'status: 400');
    fs.writeFileSync(route, content, 'utf-8');
    console.log(`Fixed 500 in ${route}`);
  }
}
