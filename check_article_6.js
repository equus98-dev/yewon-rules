const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rule = await prisma.rule.findFirst({
    where: { title: '학교법인 예원예술대학교 정관' },
    include: {
      revisions: {
        orderBy: { version: 'desc' },
        take: 1,
        include: {
          articles: {
            where: { articleNumber: 6 }
          }
        }
      }
    }
  });

  if (rule && rule.revisions.length > 0 && rule.revisions[0].articles.length > 0) {
    const art = rule.revisions[0].articles[0];
    console.log(JSON.stringify(art.contentJson, null, 2));
  }
}

main().finally(() => prisma.$disconnect());
