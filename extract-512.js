const fs = require('fs');

const rules = JSON.parse(fs.readFileSync('./pg_rules.json', 'utf-8'));
const revisions = JSON.parse(fs.readFileSync('./pg_revisions.json', 'utf-8'));
const articles = JSON.parse(fs.readFileSync('./pg_articles.json', 'utf-8'));

const rule = rules.find(r => r.ruleNumber === '5-1-2');
const rev = revisions.find(r => r.ruleId === rule.id);
const ruleArticles = articles.filter(a => a.revisionId === rev.id).sort((a, b) => a.articleNumber - b.articleNumber);

fs.writeFileSync('512_local.json', JSON.stringify(ruleArticles, null, 2), 'utf-8');
console.log('Saved to 512_local.json, total articles:', ruleArticles.length);
