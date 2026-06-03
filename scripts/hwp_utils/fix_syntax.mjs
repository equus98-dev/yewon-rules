import fs from 'fs';

let content = fs.readFileSync('src/components/ArticleRenderer.tsx', 'utf8');

// Remove the problematic line
content = content.replace("  if (!Array.isArray(items)) return null;\r\n\r\n", "");
content = content.replace("  if (!Array.isArray(items)) return null;\n\n", "");
content = content.replace("  if (!Array.isArray(items)) return null;\n", "");
content = content.replace("  if (!Array.isArray(items)) return null;", "");

fs.writeFileSync('src/components/ArticleRenderer.tsx', content, 'utf8');

console.log("Fixes applied successfully.");
