const text = "평의원회는 각 호의 사항을 심의한다. 다만, 제3호, 제4호, 및 제6호는 자문한다. <개정 2008. 7. 16.> 1. 대학의 발전계획안에 관한 사항";

let formatted = text
  .replace(/(^|[^0-9a-zA-Z가-힣])(\d{1,2}(?:의\d+)?\.)\s*(?=[^\d])/g, (match, p1, p2, offset, string) => {
    const before = string.slice(0, offset + p1.length);
    if (offset === 0 || before.match(/(?:^|\n)\s*$/)) return match;
    if (before.match(/(?:제|\(|,|및|또는|와|과|이나|나|에|의)\s*$/)) return match;
    if (before.match(/\d+(?:의\d+)?\.\s*$/)) return match;
    const openAngles = (before.match(/</g) || []).length;
    const closeAngles = (before.match(/>/g) || []).length;
    if (openAngles > closeAngles) return match;
    return p1 + '\n' + p2 + ' ';
  });

const lines = formatted.split('\n').map(l => l.trim()).filter(l => l);
let hasSeenContent = false;
const out = lines.map((line, idx) => {
    let trimmed = line.trim();
    let isInline = false;
    let textWithoutHistory = trimmed.replace(/<[^>]+>/g, '').replace(/\[[^\]]+\]/g, '').trim();
    let isJustTitle = /^\(.*\)$/.test(textWithoutHistory);
    
    if (!isJustTitle) hasSeenContent = true;

    if (idx === 0) {
        if (isJustTitle) isInline = true;
        else if (!/^[①-⑳]/.test(trimmed) && !/^\d{1,2}(?:의\d+)?\./.test(trimmed) && !/^[가-하]\./.test(trimmed)) isInline = true;
    } else {
        if (!hasSeenContent) isInline = true;
    }
    return { line: trimmed, isInline };
});
console.log(JSON.stringify(out, null, 2));
