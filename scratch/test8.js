const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.article.findMany({
    where: {
      contentText: {
        contains: '설립학칙'
      }
    }
  });
  console.log(articles);
}

main().catch(console.error).finally(() => prisma.$disconnect());
