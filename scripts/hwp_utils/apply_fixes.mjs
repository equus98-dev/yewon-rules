import fs from 'fs';

let content = fs.readFileSync('src/components/ArticleRenderer.tsx', 'utf8');

// Replace 1: Add null check to map function
content = content.replace(
  "{items.map((item, index) => {",
  "{items.map((item, index) => {\n        if (!item || typeof item !== 'object') return null;"
);

fs.writeFileSync('src/components/ArticleRenderer.tsx', content, 'utf8');

let ruleContent = fs.readFileSync('src/components/RuleViewer.tsx', 'utf8');

// Replace 2: Add optional chaining to currentRevision.articles in RuleViewer
ruleContent = ruleContent.replace(
  "currentRevision.articles && currentRevision.articles.length > 0",
  "currentRevision?.articles && currentRevision.articles.length > 0"
);

// Replace 3: Add optional chaining to currentRevision.comparisons in RuleViewer
ruleContent = ruleContent.replace(
  "currentRevision.comparisons && currentRevision.comparisons.length > 0",
  "currentRevision?.comparisons && currentRevision.comparisons.length > 0"
);

fs.writeFileSync('src/components/RuleViewer.tsx', ruleContent, 'utf8');

console.log("Fixes applied successfully.");
