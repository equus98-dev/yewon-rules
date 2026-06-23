const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.article.findMany({
    where: {
      contentText: { contains: '제27조' }
    }
  });
  
  for (const a of articles) {
    if (a.contentText && a.contentText.includes('②')) {
      console.log('--- Article ---');
      console.log(a.contentText);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
