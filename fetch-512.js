const fs = require('fs');

async function fetch512() {
  const res = await fetch("https://yewon-rules.pages.dev/api/check-14");
  const data = await res.json();
  fs.writeFileSync('512.json', JSON.stringify(data, null, 2), 'utf-8');
  console.log("Saved to 512.json");
}

fetch512();
