const text = "① 전북희망캠퍼스에 교양학부...";
let isArticleBody = true;

let formatted = text
  .replace(/(^|\s)[?•·○●\uF0B7]\s+(?=[가-하]\.|\d{1,2}(?:의\d+)?\.)/g, '$1')
  .replace(/([①-⑳])/g, (match, p1, offset, string) => {
    if (offset === 0) return match;
    const before = string.slice(0, offset);
    if (before.match(/(?:^|\n)\s*$/)) return '<br/>' + match;
    return '<br/>' + match;
  });

console.log("formatted:", JSON.stringify(formatted));

const lines = formatted.split('\n').map(l => l.trim()).filter(l => l);
console.log("lines:", lines);

let hasSeenContent = false;
lines.forEach((trimmedLine, idx) => {
  let trimmed = trimmedLine;
  let isHoOrMok = /^\d{1,2}(?:의\d+)?\./.test(trimmed) || /^[가-하]\./.test(trimmed);
  let isInline = false;
  
  if (isArticleBody) {
     if (!hasSeenContent && !isHoOrMok) {
        isInline = true;
     }
  }
  
  let isJustTitle = /^\(.*\)$/.test(trimmed);
  if (!isJustTitle) {
     hasSeenContent = true;
  }

  if (/^[①-⑳]/.test(trimmed)) {
     console.log("Found ①, isInline:", isInline);
  }
});
