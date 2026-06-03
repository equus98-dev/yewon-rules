const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rule = await prisma.rule.findFirst({
    where: { title: '사무분장 규정' },
    include: {
      revisions: {
        orderBy: { version: 'desc' },
        take: 2,
        include: {
          articles: {
            where: { articleNumber: 17 }
          }
        }
      }
    }
  });

  if (rule) console.log(JSON.stringify(rule.revisions, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
