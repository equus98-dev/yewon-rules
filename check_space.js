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
    for (const item of art.contentJson) {
       if (item.type === 'item' && item.text && item.text.includes('21. 유학생')) {
           const idx = item.text.indexOf('21. 유학생');
           const spaceBefore = item.text.charCodeAt(idx - 1);
           const spaceAfter = item.text.charCodeAt(idx + 3);
           console.log("Space before 21: charCode", spaceBefore);
           console.log("Space after 21.: charCode", spaceAfter);
       }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
