const fs = require('fs');
try {
  // It might be UTF-16LE or UTF-8
  const c = JSON.parse(fs.readFileSync('prod_categories.json', 'utf16le'));
  console.log(c.slice(0, 3));
} catch (e) {
  const c = JSON.parse(fs.readFileSync('prod_categories.json', 'utf8'));
  console.log(c.slice(0, 3));
}
