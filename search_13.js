const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rule = await prisma.rule.findFirst({
    where: { title: '학교법인 예원예술대학교 정관' },
    include: {
      revisions: { orderBy: { version: 'desc' }, take: 1, include: { articles: { where: { articleNumber: 13 } } } }
    }
  });
  if (rule && rule.revisions[0]) {
      const art = rule.revisions[0].articles[0];
      console.log('num:', art.contentJson[0].num);
      console.log('text:', art.contentJson[0].text);
  }
}
main().catch(console.error).finally(() => {
    prisma.$disconnect();
});
