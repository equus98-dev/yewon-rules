const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rule = await prisma.rule.findFirst({
    where: { 
      revisions: {
        some: {
          articles: {
            some: {
              articleNumber: 380
            }
          }
        }
      }
    },
    include: {
      revisions: {
        orderBy: { version: 'desc' },
        take: 1,
        include: {
          articles: {
            where: {
              articleNumber: {
                 gte: 370,
                 lte: 390
              }
            }
          }
        }
      }
    }
  });

  if (rule && rule.revisions[0]) {
    console.log("Rule:", rule.title);
    for (const a of rule.revisions[0].articles) {
       console.log(`Article ${a.articleNumber}:`);
       console.log("Chapter:", a.chapter);
       console.log("Section:", a.section);
       console.log(JSON.stringify(a.contentJson, null, 2));
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
