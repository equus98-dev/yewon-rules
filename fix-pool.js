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
  if (content.includes('const pool = createPool();') && content.includes('try {')) {
    content = content.replace(/const pool = createPool\(\);\s*try {/g, 'let pool;\n  try {\n    pool = createPool();');
    content = content.replace(/await pool\.end\(\);/g, 'if (pool) await pool.end();');
    fs.writeFileSync(route, content, 'utf-8');
    console.log(`Fixed pool in ${route}`);
  }
}
