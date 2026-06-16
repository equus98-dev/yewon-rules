const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const rule = await prisma.rule.findFirst({ where: { title: { contains: '대학원 학칙' } }, include: { currentRevision: { include: { articles: true } } } });
  const articles = rule.currentRevision.articles;
  const addendum = articles.filter(a => a.articleNumber >= 8000);
  console.log(JSON.stringify(addendum[addendum.length - 1], null, 2));
}
run().catch(console.error).finally(() => prisma.$disconnect());
