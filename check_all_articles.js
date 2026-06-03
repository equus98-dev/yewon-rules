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
    console.log(rule.revisions[0].articles.map(a => a.articleNumber).sort((a,b)=>a-b));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
