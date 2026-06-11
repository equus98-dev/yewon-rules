const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rule = await prisma.rule.findFirst({
    where: { title: { contains: '대학헌장' } },
    include: { revisions: { include: { articles: { orderBy: { articleNumber: 'asc' } } } } }
  });
  if (!rule) return console.log('Not found');
  const rev = rule.revisions[0];
  const art = rev.articles.find(a => a.chapter && a.chapter.includes('제3장'));
  if (art) {
    console.log('HTML of 제5조 (or first of 제3장):\\n', art.contentHtml);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
