const fs = require('fs');
const path = require('path');

const src = path.join('.open-next', 'worker.js');
const dest = path.join('.open-next', 'assets', '_worker.js');

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log('Successfully copied worker.js to assets/_worker.js for Cloudflare Pages deployment.');
} else {
  console.error('worker.js not found in .open-next');
  process.exit(1);
}
