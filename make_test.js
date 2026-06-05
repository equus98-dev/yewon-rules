const fs = require('fs');
let code = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

// We want to export require_page10
// handler.mjs ends with export{...}
// We will replace it with module.exports = { require_page10 };

code = code.replace(/export\s*\{[^}]+\};?$/, 'module.exports = { require_page10 };');

fs.writeFileSync('handler_test.cjs', code);

console.log('handler_test.cjs created');
