const fs = require('fs');
const path = '.open-next/worker.js';
let c = fs.readFileSync(path, 'utf-8');
if (!c.includes('createRequire')) {
  c = 'import { createRequire } from "node:module";\n' +
      'globalThis.require = createRequire("file:///worker.js");\n' + c;
}
fs.writeFileSync('.open-next/_worker.js', c);
fs.unlinkSync(path);
