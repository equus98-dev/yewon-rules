const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rule = await prisma.rule.findFirst({
    where: { title: { contains: '대학헌장' } },
    include: { revisions: { include: { articles: { orderBy: { articleNumber: 'asc' } } } } }
  });
  if (!rule) return console.log('Not found');
  const rev = rule.revisions[0];
  
  // Find 제11조 (the one before 제5장)
  const art11 = rev.articles.find(a => a.articleNumber === 11);
  if (art11) {
    let cleanHtml = art11.contentHtml;
    console.log('--- ORIGINAL HTML ---');
    console.log(cleanHtml);
    
    // Simulate my logic
    const trailingTitles = ['제5장 대학운영', '제1절 인사관리'];
    
    // 1. Strip empty tags
    let prevLength = -1;
    while (cleanHtml.length !== prevLength) {
      prevLength = cleanHtml.length;
      cleanHtml = cleanHtml.replace(/^(?:\s|&nbsp;|<br\s*\/?>|<(p|div|span|h[1-6])(?:\s[^>]*)?>(?:\s|&nbsp;|<br\s*\/?>)*<\/\1>)+/i, '');
      cleanHtml = cleanHtml.replace(/(?:\s|&nbsp;|<br\s*\/?>|<(p|div|span|h[1-6])(?:\s[^>]*)?>(?:\s|&nbsp;|<br\s*\/?>)*<\/\1>)+$/i, '');
    }
    console.log('--- AFTER EMPTY TAG STRIP ---');
    console.log(cleanHtml);
    
    // 2. Strip margins
    cleanHtml = cleanHtml.replace(/style="([^"]*)"/gi, (match, styleContent) => {
      let newStyle = styleContent.replace(/margin-top\s*:\s*[^;]+;?/gi, '');
      newStyle = newStyle.replace(/margin-bottom\s*:\s*[^;]+;?/gi, '');
      newStyle = newStyle.replace(/margin\s*:\s*[^;]+;?/gi, '');
      if (newStyle.trim() === '') return '';
      return `style="${newStyle}"`;
    });
    console.log('--- AFTER MARGIN STRIP ---');
    console.log(cleanHtml);
    
    // 3. Strip trailing titles
    if (cleanHtml && trailingTitles.length > 0) {
      trailingTitles.forEach(title => {
        if (!title) return;
        const chars = title.replace(/\s+/g, '').split('');
        const regexStr = chars.map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(?:\\s|&nbsp;|<[^>]+>)*');
        const chapRegex = new RegExp(`(?:\\s|&nbsp;|<[^>]+>)*${regexStr}(?:\\s|&nbsp;|<[^>]+>)*$`, 'i');
        cleanHtml = cleanHtml.replace(chapRegex, (match) => {
          return match.replace(/>([^<]+)</g, (m, textContent) => {
            return textContent.trim() === '' ? m : '><';
          }).replace(/^([^<]+)</, '<').replace(/>([^<]+)$/, '>');
        });
      });
    }
    
    console.log('--- AFTER TRAILING TITLE STRIP ---');
    console.log(cleanHtml);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
