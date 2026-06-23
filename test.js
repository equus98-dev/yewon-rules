const text = '(임원의 겸직금지) ① 이사장은 당해 학교법인이 설치.경영하는 사립학교의 장을 겸할 수 없다. <개정 2008. 7. 16.> ② 이사는 감사 또는 당해 학교법인이 설치.경영하는 학교의 교원 기타 직원을 겸할 수 없다.';
let formatted = text
  .replace(/(^|\s)[?•·○●\uF0B7]\s+(?=[가-하]\.|\d{1,2}(?:의\d+)?\.)/g, '$1')
  .replace(/([①-⑳])/g, (match, p1, offset, string) => {
    const before = string.slice(0, offset);
    const after = string.slice(offset + 1);
    if (/(?:^|\n)제\d+조(?:의\d+)?\s*(?:\[.*\]|\(.*\)|\〔.*\〕)?\s*$/.test(before)) return match;
    if (/(?:제|\(|,|및|또는|와|과|이나|나)\s*$/.test(before)) return match;
    if (/^\s*(?:항|호)/.test(after)) return match;
    if (offset === 0 || before.endsWith('\n')) return match;
    return '\n' + match;
  });
console.log('FORMATTED:', JSON.stringify(formatted));

const lines = formatted.split('\n').map(l => l.trim()).filter(l => l);
let hasSeenContent = false;
lines.forEach((trimmedLine, idx) => {
  let trimmed = trimmedLine;
  let isHoOrMok = /^\d{1,2}(?:의\d+)?\./.test(trimmed) || /^[가-하]\./.test(trimmed);
  let isInline = false;
  
  if (!hasSeenContent && !isHoOrMok) {
      isInline = true;
  }
  
  let textWithoutHistory = trimmed.replace(/<[^>]+>/g, '').replace(/\[[^\]]+\]/g, '').trim();
  let isJustTitle = /^\(.*\)$/.test(textWithoutHistory);
  
  if (!isJustTitle) {
      hasSeenContent = true;
  }
  console.log(`idx: ${idx}, isInline: ${isInline}, trimmed: ${trimmed}`);
});
