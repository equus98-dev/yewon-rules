const fs = require('fs');
const code = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');
const regex = /var (require_(?:page|route)\d*)=__commonJS\(\{([^:]+)\"\(exports/g;
let match;
while ((match = regex.exec(code)) !== null) {
  const name = match[1];
  const endIdx = code.indexOf('var require_', match.index + 20);
  const pageCode = code.substring(match.index, endIdx > -1 ? endIdx : match.index + 5000);
  if (!pageCode.includes('handler:')) {
    console.log(name, 'MISSING HANDLER');
  }
}
console.log('done');
