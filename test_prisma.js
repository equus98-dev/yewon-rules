const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const rule = await prisma.rule.findFirst({ where: { title: { contains: '학교법인 감사규정' } }, include: { currentRevision: { include: { articles: true } } } });
  const a19 = rule.currentRevision.articles.find(a => a.articleNumber === 19);
  console.log(a19.contentJson);
  prisma.$disconnect();
}
run();
