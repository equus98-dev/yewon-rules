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

  if (!rule || !rule.revisions.length || !rule.revisions[0].articles.length) {
    console.log("No articles found");
    return;
  }

  const art12 = rule.revisions[0].articles.find(a => a.articleNumber === 120 || a.articleNumber === 12);
  if (!art12) {
    console.log("Article 12 not found. Available numbers:", rule.revisions[0].articles.map(a => a.articleNumber));
    return;
  }

  console.log("ArticleNumber:", art12.articleNumber);
  console.log(JSON.stringify(art12.contentJson, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
