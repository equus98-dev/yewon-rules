const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const article = await prisma.article.findFirst({
    where: {
      rule: { title: { contains: '직제' } },
      articleNumber: 1
    }
  });
  console.log(article?.contentJson);
  console.log(article?.contentText);
}

main().catch(console.error).finally(() => prisma.$disconnect());
