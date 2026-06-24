const actualBody = '① 대학교의 각 학부(과)에 학부(과)장을 둔다.';

const lines = actualBody.split('\n').map(l => l.trim()).filter(l => l);
let hasSeenContent = false;
let isArticleBody = true;

const results = lines.map((trimmed, idx) => {
    let isHoOrMok = /^\d{1,2}(?:의\d+)?\./.test(trimmed) || /^[가-하]\./.test(trimmed);
    let isInline = false;
    
    if (isArticleBody) {
       if (!hasSeenContent && !isHoOrMok) {
          isInline = true;
       }
    }
    
    let textWithoutHistory = trimmed.replace(/<[^>]+>/g, '').replace(/\[[^\]]+\]/g, '').trim();
    let isJustTitle = /^\(.*\)$/.test(textWithoutHistory);
    
    if (!isJustTitle) {
       hasSeenContent = true;
    }

    if (isArticleBody && idx === 0) {
        if (/^제\d+조/.test(trimmed) && !/[『「]$/.test(trimmed.slice(0, trimmed.search(/제\d+조/)))) {
            let titlePart = trimmed;
            let body = "";
            const titleMatch = trimmed.match(/^(제\d+조(?:의\d+)?)\s*(?:\([^)]+\)|\[[^\]]+\]|〔[^〕]+〕|（[^）]+）)?\s*(.*)/);
            if (titleMatch) {
               body = titleMatch[2];
               titlePart = trimmed.substring(0, trimmed.length - body.length).trim();
            }
            return `FORMAT_GLUED_TITLE: ${titlePart} | BODY: ${body}`;
        }
    }

    if (/^[①-⑳]/.test(trimmed)) {
        const numMatch = trimmed.match(/^([①-⑳])\s*(.*)/);
        if (numMatch) {
          if (isInline) {
            return `INLINE_SPAN: ${numMatch[1]} ${numMatch[2]}`;
          }
          return `BLOCK_DIV: ${numMatch[1]} ${numMatch[2]}`;
        }
    }
    return `OTHER: ${trimmed}`;
});

console.log(results);
