const fs = require('fs');
let content = fs.readFileSync('src/components/ArticleRenderer.tsx', 'utf-8');

const oldBlock = `    // title이 "부칙 (날짜)" 형태면 title에서 날짜 추출\r
    if (!headerAnnotation && title && title !== "부칙" && !/^부\\s*칙$/.test(title.trim())) {\r
      const titleRest = title.replace(/^부\\s*칙\\s*/, "").trim();\r
      if (titleRest) {\r
        let normalized = titleRest;\r
        if (normalized.startsWith("(")) {\r
          normalized = "<" + normalized.substring(1, normalized.length - 1) + ">";\r
        }\r
        normalized = normalized.replace(/(\\d{1,2})([>)])$/, "$1.$2");\r
        headerAnnotation = normalized;\r
      }\r
    }`;

const newBlock = `    // title이 "부칙 (날짜)" 형태면 title에서 날짜 추출\r
    // 단, "제N조..." 형태의 조문 번호이면 headerAnnotation으로 쓰지 않음\r
    if (!headerAnnotation && title && title !== "부칙" && !/^부\\s*칙$/.test(title.trim())) {\r
      const titleRest = title.replace(/^부\\s*칙\\s*/, "").trim();\r
      // "제N조..." 형태이면 조문 제목이므로 스킵, 날짜/제정/개정 키워드 있는 경우에만 headerAnnotation으로 설정\r
      if (titleRest && !/^제\\d+조/.test(titleRest) && /\\d{2,4}[.\\s년]|개정|제정|신설/.test(titleRest)) {\r
        let normalized = titleRest;\r
        if (normalized.startsWith("(")) {\r
          normalized = "<" + normalized.substring(1, normalized.length - 1) + ">";\r
        }\r
        normalized = normalized.replace(/(\\d{1,2})([>])$/, "$1.$2");\r
        headerAnnotation = normalized;\r
      }\r
    }`;

if (content.includes(oldBlock)) {
    content = content.replace(oldBlock, newBlock);
    fs.writeFileSync('src/components/ArticleRenderer.tsx', content, 'utf-8');
    console.log('SUCCESS');
} else {
    console.log('NOT FOUND');
}
