const fs = require('fs');
const data = JSON.parse(fs.readFileSync('all_articles.json', 'utf8'));

const results = [];

data.forEach(d => {
  if (d.results) {
    const rulesFound = new Set();
    d.results.forEach(item => {
      // Find rules where the rule name matches our target
      const title = item.title || '';
      if (!rulesFound.has(item.ruleId)) {
        if (item.ruleTitle && (item.ruleTitle.includes('직제') || item.ruleTitle.includes('학칙') || item.ruleTitle.includes('위임') || item.ruleTitle.includes('사무분장'))) {
           results.push(item.ruleTitle);
           rulesFound.add(item.ruleId);
        }
      }
    });
  }
});
console.log(Array.from(new Set(results)));
