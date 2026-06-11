const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rule = await prisma.rule.findFirst({
    where: { title: { contains: '대학헌장' } },
    include: { revisions: { include: { articles: { orderBy: { articleNumber: 'asc' } } } } }
  });
  if (!rule) return console.log('Not found');
  const rev = rule.revisions[0];
  const art = rev.articles.find(a => a.chapter && a.chapter.includes('제2장'));
  console.log(JSON.stringify(art, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
