import fs from 'fs';

let content = fs.readFileSync('src/components/ArticleRenderer.tsx', 'utf8');

const searchStr1 = "          // ?스???더?          if (!hasSeenBody) {";
const searchStr2 = "          // ?스???더?          if (!hasSeenBody) {";
const searchStr3 = "          // 텍스트 렌더링          if (!hasSeenBody) {";

if (content.includes(searchStr1)) {
    content = content.replace(searchStr1, "          // 텍스트 렌더링\n          if (!hasSeenBody) {");
} else if (content.includes(searchStr2)) {
    content = content.replace(searchStr2, "          // 텍스트 렌더링\n          if (!hasSeenBody) {");
} else if (content.includes(searchStr3)) {
    content = content.replace(searchStr3, "          // 텍스트 렌더링\n          if (!hasSeenBody) {");
} else {
    // regex fallback
    content = content.replace(/\/\/[^\n]*if \(!hasSeenBody\) \{/, "// 텍스트 렌더링\n          if (!hasSeenBody) {");
}

fs.writeFileSync('src/components/ArticleRenderer.tsx', content, 'utf8');
console.log("Syntax fixed.");
