import fs from 'fs';

let lines = fs.readFileSync('src/components/ArticleRenderer.tsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("if (!hasSeenBody) {") && lines[i].includes("//")) {
        lines[i] = "          // 텍스트 렌더링\n          if (!hasSeenBody) {";
    }
}

fs.writeFileSync('src/components/ArticleRenderer.tsx', lines.join('\n'), 'utf8');
console.log("Syntax fixed.");
