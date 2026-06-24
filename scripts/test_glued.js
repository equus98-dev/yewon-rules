function formatGluedText(text, isArticleBody = false) {
    let formatted = text
      .replace(/(^|\s)[?•·○●\uF0B7]\s+(?=[가-하]\.|\d{1,2}(?:의\d+)?\.)/g, '$1')
      .replace(/([①-⑳])/g, (match, p1, offset, string) => {
        const before = string.slice(0, offset);
        const after = string.slice(offset + 1);
        
        if (/(?:제|\(|,|및|또는|와|과|이나|나|에|의)\s*$/.test(before)) return match;
        if (/^\s*(?:항|호)/.test(after)) return match;

        if (offset === 0) return match;
        
        if (before.match(/(?:^|<[^>]+>)*제\d+조(?:의\d+)?(?:<[^>]+>)*\s*(?:\[[^\]]*\]|〔[^〕]*〕|\([^)]*\)|（[^）]*）)?\s*(?:<[^>]+>)*\s*$/)) return match;
        if (before.match(/(?:<br\s*\/?>|<\/p>|<p>|<div[^>]*>|<td[^>]*>|<th[^>]*>|<li[^>]*>)\s*$/i)) return match;
        if (before.match(/(?:^|\n)\s*$/)) return '\n' + match;
        return '\n' + match;
      })
      .replace(/(^|\s)([가-하]\.)[ \t]+/g, (match, p1, p2, offset, string) => {
        const before = string.slice(0, offset + p1.length);
        if (offset === 0 || before.match(/(?:^|\n)\s*$/)) return match;
        return p1 + '\n' + p2 + ' ';
      })
      .replace(/(제\d+조의?\d*\s*[\[〔(（].*?[\]〕)）])\s*\n+(?=[^\n])/g, '$1 ')
      .replace(/(^|\n|[.!?]\s*)((?<![『「])제\d+조의?\d*\s*(?:\[(?![ \s\S]*?\[\/cite\])|[〔(（]).*?[\]〕)）])/g, '$1\n\n$2')
      .replace(/(제\d+(?:장|절|관)\s+(?!(?:제\d+(?:조|항|호|목|장|절|관)?|및|에|의|은|는|이|가|을|를|과|와)(?:\s|$))[^\s]+)/g, (match, p1, offset, string) => {
         if (offset > 0) {
             const beforeMatch = string.slice(0, offset).trim();
             if (beforeMatch.length > 0) {
                 const prevChar = beforeMatch[beforeMatch.length - 1];
                 if (/[가-힣A-Za-z0-9"“'‘\[(]/.test(prevChar)) {
                     return match;
                 }
             }
         }
         return '\n\n' + p1;
      })
      .replace(/(^|\n)(부\s*칙)\s*(.*)/g, '\n\n$2 $3')
      .replace(/(부\s*칙\s*(?:\([^)]*\)|<[^>]*>|\[[^\]]*\]|〔[^〕]*〕)?)\s+(\d{1,2}\.|\([가-힣\s·]{2,}\))/gi, '$1\n$2');

    formatted = formatted.replace(/(\([^)]*(?:시행일|경과조치|적용례|적용범위|준용|폐지|예외|단서|특례|임기|존속기간|관련|시행|적용)[^)]*\))/g, (match, paren, offset, str) => {
      const before = str.slice(0, offset);
      if (before.match(/\n\s*$/)) return match;
      if (before.match(/\d+(?:의\d+)?\.\s*$/)) return match;
      if (before.match(/제\d+조의?\d*\s*$/)) return match;
      if (before.match(/\d\s*$/)) return match;
      return match;
    });

    formatted = formatted.replace(/(\((?:<[^>]+>)*[가-힣A-Za-z0-9\s·,\u200B-\u200D\uFEFF]{2,}[^)]*\))/g, (match, paren, offset, str) => {
      const before = str.slice(0, offset);
      if (before.match(/\n\s*$/)) return match;
      if (before.match(/\d+(?:의\d+)?\.\s*$/)) return match;
      if (before.match(/제\d+조의?\d*\s*$/)) return match;
      if (before.match(/\d\s*$/)) return match;

      if (!before.match(/(?:^|[.\s>\]]|&nbsp;)$/i)) return match;
      return '\n' + match;
    });

    return formatted;
}

const text = "① 전북희망캠퍼스에 교양학부, 게임애니메이션학과, 스포츠융합복지학과, 글로벌문화경영학부(문화예술경영전공, 한국문화예술전공, 문화예술관광전공, K-뷰티전공)";
console.log(JSON.stringify(formatGluedText(text, true)));
