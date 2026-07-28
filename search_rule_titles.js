const fs = require('fs');

const files = fs.readdirSync('.');
const jsonFiles = files.filter(f => f.endsWith('.json'));
let rules = new Set();

jsonFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (content.startsWith('[')) {
      const data = JSON.parse(content);
      data.forEach(item => {
        if (item.ruleTitle) rules.add(item.ruleTitle);
        if (item.title && file.includes('rule')) rules.add(item.title);
      });
    } else if (content.startsWith('{')) {
      const data = JSON.parse(content);
      if (data.Rule) {
        data.Rule.forEach(r => rules.add(r.title));
      }
    }
  } catch (e) {
    // ignore
  }
});

const rulesArr = Array.from(rules);
const keywords = ['학칙', '직제', '위임', '사무', '편제', '조직'];
const matched = rulesArr.filter(r => keywords.some(k => r.includes(k)));

console.log(matched);
