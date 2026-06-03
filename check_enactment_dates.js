const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const revisions = await prisma.revision.findMany({
    where: { revisionType: 'ENACTMENT' },
    include: {
      rule: true,
      articles: {
        where: { articleNumber: { gte: 8000, lt: 9000 } },
        orderBy: { articleNumber: 'asc' }
      }
    }
  });

  for (const rev of revisions) {
    console.log(`Rule: ${rev.rule.title}`);
    console.log(`Enactment Date: ${rev.enactmentDate.toISOString()}`);
    console.log(`Effective Date: ${rev.effectiveDate.toISOString()}`);
    if (rev.articles.length > 0) {
      console.log(`First Addendum:`);
      console.log(JSON.stringify(rev.articles[0].contentJson));
    }
    console.log('---');
  }
}

main().catch(console.error).finally(() => {
    prisma.$disconnect();
});
