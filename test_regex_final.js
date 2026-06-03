const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rule = await prisma.rule.findFirst({
    where: { title: '사무분장 규정' },
    include: {
      revisions: {
        orderBy: { version: 'desc' },
        take: 1,
        include: {
          articles: true
        }
      }
    }
  });

  if (rule && rule.revisions[0]) {
    const art = rule.revisions[0].articles.find(a => a.articleNumber === 15);
    if (!art) return;
    for (const item of art.contentJson) {
       if (item.type === 'item' && item.text && item.text.includes('유학생 오리엔테이션')) {
           const safeText = `${item.num || ''} ${item.text}`.trim();
           console.log("Original safeText length:", safeText.length);
           let formatted = safeText
            .replace(/(?:^|\s)(①|②|③|④|⑤|⑥|⑦|⑧|⑨|⑩|⑪|⑫|⑬|⑭|⑮)/g, '\n$1')
            .replace(/(?:^|\s)(\d{1,2}\.)\s+(?=[^\d])/g, '\n$1 ')
            .replace(/(?:^|\s)([가-하]\.)\s+/g, '\n$1 ')
            .replace(/(?:^|\s)(제\d+조의?\d*\([^)]+\))/g, '\n\n$1')
            .replace(/(?:^|\s)(제\d+장\s+[^\s]+)/g, '\n\n$1');
           console.log("Formatted contains newline?", formatted.includes('\n'));
           if (!formatted.includes('\n')) {
             console.log("Regex failed to split.");
             const idx = safeText.indexOf('21. 유학생');
             console.log("Hex around 21:", Buffer.from(safeText.substring(idx - 2, idx + 5)).toString('hex'));
           } else {
             console.log("Regex worked! Lines:", formatted.split('\n').length);
           }
       }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
