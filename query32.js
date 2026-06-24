const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rule = await prisma.rule.findFirst({ where: { ruleNo: '2-0-2' } });
  if (!rule) { console.log('Rule not found'); return; }
  const article = await prisma.article.findFirst({ where: { ruleId: rule.id, articleNumber: 32 } });
  if (article) console.log(article.contentHtml);
  else console.log('Article not found');
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
