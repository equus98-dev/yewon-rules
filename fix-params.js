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
  let changed = false;

  // Replace { params }: { params: { id: string } } with Promise<{ id: string }>
  const regex = /\{ params \}:\s*\{\s*params:\s*\{\s*([^}]+)\s*\}\s*\}/g;
  if (regex.test(content)) {
    content = content.replace(regex, '{ params }: { params: Promise<{ $1 }> }');
    changed = true;
  }
  
  const regex2 = /\{ params \}:\s*\{\s*([^}]+)\s*\}/g;
  if (regex2.test(content)) {
    // If it's already { params }: { id: string }, etc.
    content = content.replace(regex2, '{ params }: { params: Promise<{ $1 }> }');
    changed = true;
  }

  // Also replace `const { id } = params;` with `const { id } = await params;`
  const assignRegex = /const\s+\{\s*([^}]+)\s*\}\s*=\s*params;/g;
  if (assignRegex.test(content)) {
    content = content.replace(assignRegex, 'const { $1 } = await params;');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Fixed params in ${file}`);
  }
}
