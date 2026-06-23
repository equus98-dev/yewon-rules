const fs = require('fs');
const buffer = fs.readFileSync('./prisma/dev.db');
const text = buffer.toString('utf8');
const index = text.indexOf('제19조의5');
if (index !== -1) {
  console.log(text.substring(Math.max(0, index - 50), index + 500));
}
