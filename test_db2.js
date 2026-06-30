const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const rule = await prisma.rule.findFirst({ where: { title: { contains: 'Á¤°ü' } }, include: { currentRevision: { include: { articles: { orderBy: { articleNumber: 'asc' } } } } } });
  const addendums = rule.currentRevision.articles.filter(a => a.articleNumber >= 8999 || (a.title && a.title.includes('Ä¢')));
  console.log(addendums.map(a => ({ id: a.id, title: a.title })));
}
run().finally(() => prisma.$disconnect());
