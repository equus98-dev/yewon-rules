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

const files = walkDir(path.join(__dirname, 'src', 'app', 'api'));
let count = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  if (content.includes('@opennextjs/cloudflare') || content.includes('getCloudflareContext')) {
    content = content.replace(/@opennextjs\/cloudflare/g, '@cloudflare/next-on-pages');
    content = content.replace(/getCloudflareContext/g, 'getRequestContext');
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Fixed references in ${file}`);
    count++;
  }
}
console.log(`Done. Fixed ${count} files.`);
