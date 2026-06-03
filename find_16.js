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
    for (const a of rule.revisions[0].articles) {
       const textDump = JSON.stringify(a.contentJson);
       if (textDump.includes('제16조(학생생활관)')) {
          console.log('Found in articleNumber:', a.articleNumber);
          console.log(textDump);
       }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
