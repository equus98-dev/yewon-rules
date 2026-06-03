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
    const arts = rule.revisions[0].articles.filter(a => a.articleNumber >= 15 && a.articleNumber <= 20);
    for (const a of arts) {
       console.log('--- Article', a.articleNumber, '---');
       console.log(JSON.stringify(a.contentJson, null, 2));
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
