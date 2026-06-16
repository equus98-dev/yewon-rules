const fs = require('fs');
let content = fs.readFileSync('src/components/ArticleRenderer.tsx', 'utf-8');

const oldStr = '  if (isAddendumArticle) {\r\n    // ── 1. 모든 아이템에서 텍스트 수집\r\n    const rawLines: string[] = [];\r\n    for (const item of displayItems) {\r\n      if (!item) continue;\r\n      let raw = String(item.text || "").trim();\r\n      if (!raw) continue;\r\n      raw = raw.replace(/^(?:부\\s*칙\\s*)+/, "").trim();\r\n      if (raw) rawLines.push(raw);\r\n    }';

const newStr = '  if (isAddendumArticle) {\r\n    // ── 1. 모든 아이템에서 텍스트 수집 (별표/별지 나오면 이후 무시)\r\n    const rawLines: string[] = [];\r\n    for (const item of displayItems) {\r\n      if (!item) continue;\r\n      const itemText = String(item.text || "").trim();\r\n      // 별표/별지/서식으로 시작하는 아이템이 나오면 이후는 모두 찌꺼기이므로 중단\r\n      if (/^[\\[〔【<]\\s*(별표|별지|서식|별첨)/.test(itemText)) break;\r\n      // num이 있는 article 타입: "제N조(제목) 본문" 형태로 합쳐서 추가\r\n      let raw = "";\r\n      if (item.type === "article" && item.num) {\r\n        raw = (item.num + " " + itemText).trim();\r\n      } else {\r\n        raw = itemText;\r\n      }\r\n      if (!raw) continue;\r\n      raw = raw.replace(/^(?:부\\s*칙\\s*)+/, "").trim();\r\n      if (raw) rawLines.push(raw);\r\n    }';

if (content.includes(oldStr)) {
    content = content.replace(oldStr, newStr);
    fs.writeFileSync('src/components/ArticleRenderer.tsx', content, 'utf-8');
    console.log('SUCCESS');
} else {
    console.log('NOT FOUND');
}
