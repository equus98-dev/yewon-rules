const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rules = await prisma.rule.findMany({
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

  for (const r of rules) {
    if (r.revisions[0]) {
      for (const a of r.revisions[0].articles) {
         const textDump = JSON.stringify(a.contentJson);
         if (textDump.includes('제38조(임용)')) {
            console.log("Rule:", r.title);
            console.log(`Article ${a.articleNumber}:`);
            console.log("Chapter:", a.chapter);
            console.log("Section:", a.section);
            console.log(textDump);
         }
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
