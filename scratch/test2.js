const fs = require('fs');
const data = JSON.parse(fs.readFileSync('addendum.json', 'utf8'));
const r202 = data.filter(d => d.ruleId === 104 || d.ruleId === 202 || true); // We need to find rule 2-0-2. Let's just search for '설립학칙'
const match = data.find(d => d.contentText && d.contentText.includes('설립학칙'));
if (match) {
  console.log("FOUND in addendum.json!");
  console.log("contentText:", match.contentText);
  console.log("contentHtml:", match.contentHtml);
} else {
  console.log("Not found in addendum.json");
}
