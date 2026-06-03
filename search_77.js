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
            where: { articleNumber: 77 }
          }
        }
      }
    }
  });

  if (rule && rule.revisions[0]) {
      console.log(JSON.stringify(rule.revisions[0].articles, null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
