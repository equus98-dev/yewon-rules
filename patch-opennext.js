const fs = require('fs');
const path = 'node_modules/@opennextjs/cloudflare/dist/cli/build/open-next/createServerBundle.js';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('minify: options.minify,')) {
  code = code.replace('minify: options.minify,', 'minifyIdentifiers: false, minifySyntax: options.minify, minifyWhitespace: options.minify, keepNames: true,');
  fs.writeFileSync(path, code);
  console.log('Patched OpenNext esbuild config to avoid minifying identifiers!');
} else {
  console.log('Warning: Could not find "minify: options.minify," to patch in OpenNext');
}
