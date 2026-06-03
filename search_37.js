const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rules = await prisma.rule.findMany({
    where: { title: '학교법인 예원예술대학교 정관' },
    include: {
      revisions: {
        orderBy: { version: 'desc' },
        take: 1,
        include: {
          articles: {
            where: { articleNumber: 37 }
          }
        }
      }
    }
  });

  if (rules.length && rules[0].revisions[0]) {
      console.log(JSON.stringify(rules[0].revisions[0].articles, null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
