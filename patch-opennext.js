const fs = require('fs');
const path = 'node_modules/@opennextjs/cloudflare/dist/cli/build/open-next/createServerBundle.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('mangle: true')) {
  code = code.replace(/mangle:\s*true/g, 'mangle: false');
  fs.writeFileSync(path, code);
  console.log('Patched OpenNext to set mangle: false');
} else {
  console.log('Warning: Could not find "mangle: true" to patch in OpenNext');
}
