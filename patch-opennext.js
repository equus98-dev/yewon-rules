const fs = require('fs');
const path = 'node_modules/@opennextjs/cloudflare/dist/cli/build/open-next/createServerBundle.js';
let code = fs.readFileSync(path, 'utf8');
if (!code.includes('keepNames')) {
  code = code.replace('minify: !options.noMinify,', 'minify: !options.noMinify, keepNames: true,');
  fs.writeFileSync(path, code);
  console.log('Patched OpenNext esbuild config to keepNames');
}
