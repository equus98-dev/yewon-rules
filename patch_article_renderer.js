const fs = require('fs');
const file = 'src/components/ArticleRenderer.tsx';
let content = fs.readFileSync(file, 'utf8');

const target1 = `    const cleanExpected = expectedTitleStart.replace(/\\s+/g, '');
    const cleanFull = fullTitle.replace(/\\s+/g, '');`;

const replace1 = `    const cleanExpected = expectedTitleStart.replace(/[\\s\\u200B-\\u200D\\uFEFF]/g, '');
    const cleanFull = fullTitle.replace(/[\\s\\u200B-\\u200D\\uFEFF]/g, '');`;

content = content.replace(target1, replace1);

const target2 = `        if (items[i]) {
            const rawTextStr = String(items[i].text || "");
            const textStr = rawTextStr.trim();
            const cleanTextStr = rawTextStr.replace(/<[^>]+>/g, '').replace(/\\s+/g, '');`;

const replace2 = `        if (items[i]) {
            const rawTextStr = String(items[i].text || "");
            const textStr = rawTextStr.replace(/[\\u200B-\\u200D\\uFEFF]/g, '').trim();
            const cleanTextStr = rawTextStr.replace(/<[^>]+>/g, '').replace(/[\\s\\u200B-\\u200D\\uFEFF]/g, '');`;

content = content.replace(target2, replace2);

const target3 = `      let targetIndex = -1;
      for (let i = 0; i < Math.min(items.length, 3); i++) {
        const text = String(items[i]?.text || "").trim();
        if (text && !/^[\[〔]?(?:시행|제정|개정)/.test(text) && !text.includes("담당부서")) {
          targetIndex = i;
          break;
        }
      }
      
      if (targetIndex !== -1 && items[targetIndex]) {
        let originalText = String(items[targetIndex].text || "").trim();
        if (articleNumber >= 8000 && articleNumber < 9000) {
           originalText = originalText.replace(/^(?:부\\s*칙\\s*)+/, '');
        }
        items[targetIndex].text = \`\${fullTitle}\\n\${originalText}\`;
      }`;

const replace3 = `      let targetIndex = -1;
      for (let i = 0; i < Math.min(items.length, 3); i++) {
        const text = String(items[i]?.text || "").replace(/[\\u200B-\\u200D\\uFEFF]/g, '').trim();
        if (text && !/^[\[〔]?(?:시행|제정|개정)/.test(text) && !text.includes("담당부서")) {
          targetIndex = i;
          break;
        }
      }
      
      if (targetIndex !== -1 && items[targetIndex]) {
        let originalText = String(items[targetIndex].text || "").trim();
        const cleanOriginal = originalText.replace(/<[^>]+>/g, '').replace(/[\\s\\u200B-\\u200D\\uFEFF]/g, '');
        // [버그 수정]: 원문에 이미 "제N조"가 포함되어 있는데 HWP 쓰레기값 때문에 alreadyHasTitle이 뚫렸을 경우, 중복 삽입 방지
        if (!cleanOriginal.includes(cleanExpected)) {
          if (articleNumber >= 8000 && articleNumber < 9000) {
             originalText = originalText.replace(/^(?:부\\s*칙\\s*)+/, '');
          }
          items[targetIndex].text = \`\${fullTitle}\\n\${originalText}\`;
        }
      }`;

content = content.replace(target3, replace3);

fs.writeFileSync(file, content);
console.log('Patch applied.');
