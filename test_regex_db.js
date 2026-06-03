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
    const arts = rule.revisions[0].articles.filter(a => a.text && a.text.includes('유학생 오리엔테이션'));
    for (const a of arts) {
       console.log("Found text length:", a.text.length);
       let formatted = a.text
        .replace(/(?:^|\s)(①|②|③|④|⑤|⑥|⑦|⑧|⑨|⑩|⑪|⑫|⑬|⑭|⑮)/g, '\n$1')
        .replace(/(?:^|\s)(\d{1,2}\.)\s+(?=[^\d])/g, '\n$1 ')
        .replace(/(?:^|\s)([가-하]\.)\s+/g, '\n$1 ')
        .replace(/(?:^|\s)(제\d+조의?\d*\([^)]+\))/g, '\n\n$1')
        .replace(/(?:^|\s)(제\d+장\s+[^\s]+)/g, '\n\n$1');
       console.log("Formatted contains newline?", formatted.includes('\n'));
       if (!formatted.includes('\n')) {
         console.log("Failed to split! Here is a hex dump of the space around '21.':");
         const idx = a.text.indexOf('21.');
         if (idx !== -1) {
             console.log("Substring:", a.text.substring(idx - 5, idx + 5));
             console.log("Hex:", Buffer.from(a.text.substring(idx - 5, idx + 5)).toString('hex').match(/../g).join(' '));
         }
       } else {
         console.log("It did split in Node.js!");
         console.log(formatted.substring(0, 100));
       }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
