const fs = require('fs');
const data = JSON.parse(fs.readFileSync('docs/202_addendum_2.json', 'utf8'));
const text = data.contentText;
const tableStart = text.indexOf('<table');
if (tableStart !== -1) {
  fs.writeFileSync('docs/table_raw.html', text.slice(tableStart));
  console.log("Extracted table.");
} else {
  console.log("No table found.");
}
