const text = "① 전북희망캠퍼스에 교양학부";

let formatted = text
  .replace(/(^|\s)[?•·○●\uF0B7]\s+(?=[가-하]\.|\d{1,2}(?:의\d+)?\.)/g, '$1')
  .replace(/([①-⑳])/g, (match, p1, offset, string) => {
    const before = string.slice(0, offset);
    const after = string.slice(offset + 1);
    
    if (/(?:제|\(|,|및|또는|와|과|이나|나|에|의)\s*$/.test(before)) return match;
    if (/^\s*(?:항|호)/.test(after)) return match;
    if (offset === 0 || before.match(/(?:^|\n)\s*$/)) return match;
    if (before.match(/(?:^|<[^>]+>)*제\d+조(?:의\d+)?(?:<[^>]+>)*\s*(?:\[[^\]]*\]|〔[^〕]*〕|\([^)]*\)|（[^）]*）)?\s*(?:<[^>]+>)*\s*$/)) return match;
    return '\n' + match;
  });

formatted = formatted.replace(/(제\d+조의?\d*\s*[\[〔(（].*?[\]〕)）])\s*\n+(?=[^\n])/g, '$1 ')
  .replace(/(^|\n|[.!?]\s*)((?<![『「])제\d+조의?\d*\s*(?:\[(?![ \s\S]*?\[\/cite\])|[〔(（]).*?[\]〕)）])/g, '$1\n\n$2');

const lines = formatted.split('\n').map(l => l.trim()).filter(l => l);

let hasSeenContent = false;
let isArticleBody = true;

const result = lines.map((trimmedLine, idx) => {
  let trimmed = trimmedLine;
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

  if (/^[①-⑳]/.test(trimmed)) {
     const numMatch = trimmed.match(/^([①-⑳])\s*(.*)/);
     if (numMatch) {
       return { idx, text: trimmed, isInline };
     }
  }
  return { idx, text: trimmed, isInline };
});

console.log(JSON.stringify(result, null, 2));
