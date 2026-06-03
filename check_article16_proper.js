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
    const art = rule.revisions[0].articles.find(a => a.articleNumber === 160);
    if (art) console.log(JSON.stringify(art.contentJson, null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
