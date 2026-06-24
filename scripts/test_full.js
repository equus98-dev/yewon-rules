const fs = require('fs');

const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres.jagpwxgasudlnaoxfroe:Tmtmfh0022%24%26%2A@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });
  await client.connect();
  const res = await client.query('SELECT a."contentJson" FROM "Article" a JOIN "Revision" r ON a."revisionId" = r.id JOIN "Rule" ru ON r."ruleId" = ru.id WHERE ru."ruleNumber" = \'2-0-2\' AND a."articleNumber" = 3 ORDER BY a."sortOrder" LIMIT 1');
  const contentJson = res.rows[0].contentJson;
  await client.end();
  
  const actualBody = contentJson[0].text;
  
  // Now simulate formatGluedText
  let text = actualBody;
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
      })
      .replace(/(\s|>|&nbsp;|<br\s*\/?>)(\d{1,2}(?:의\d+)?\.)\s*(?=[^\d])/g, (match, p1, p2, offset, string) => {
        const before = string.slice(0, offset + p1.length);
        if (offset === 0 || before.match(/(?:^|\n)\s*$/)) return match;
        if (before.match(/(?:제|\(|,|및|또는|와|과|이나|나|에|의)\s*$/)) return match;
        if (before.match(/\d+(?:의\d+)?\.\s*$/)) return match;
        if (p1 !== '>') {
            const openAngles = (before.match(/</g) || []).length;
            const closeAngles = (before.match(/>/g) || []).length;
            if (openAngles > closeAngles) return match;
        }
        return p1 + '\n' + p2 + ' ';
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

  const lines = formatted.split('\n').map(l => l.trim()).filter(l => l);
  console.log(lines.map((l, i) => `Line ${i}: ${l.substring(0, 30)}...`));

  let hasSeenContent = false;
  lines.forEach((trimmedLine, idx) => {
    let trimmed = trimmedLine.replace(/__CITATION_(\d+)__/g, '');
    let isHoOrMok = /^\d{1,2}(?:의\d+)?\./.test(trimmed) || /^[가-하]\./.test(trimmed);
    let isInline = false;
    
    if (true) {
       if (!hasSeenContent && !isHoOrMok) {
          isInline = true;
       }
    }
    
    let textWithoutHistory = trimmed.replace(/<[^>]+>/g, '').replace(/\[[^\]]+\]/g, '').trim();
    let isJustTitle = /^\(.*\)$/.test(textWithoutHistory);
    
    if (!isJustTitle) {
       hasSeenContent = true;
    }
    
    console.log(`idx: ${idx}, isInline: ${isInline}, trimmed: ${trimmed.substring(0, 30)}...`);
  });
}
run();
