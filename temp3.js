const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rule = await prisma.rule.findFirst({
    where: { title: { contains: '대학헌장' } },
    include: { revisions: { include: { articles: { orderBy: { articleNumber: 'asc' } } } } }
  });
  if (!rule) return console.log('Not found');
  const rev = rule.revisions[0];
  // Find article right before 제4장
  const artIdx = rev.articles.findIndex(a => a.chapter && a.chapter.includes('제4장'));
  if (artIdx > 0) {
    const prevArt = rev.articles[artIdx - 1];
    console.log('--- PREV ARTICLE (should contain trailing 제4장) HTML ---');
    console.log(prevArt.contentHtml);
    console.log('--- END ---');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
