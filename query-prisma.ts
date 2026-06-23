import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.article.findMany({
    where: { contentText: { contains: '제27조' } }
  });
  
  for (const a of articles) {
    if (a.contentText && a.contentText.includes('②')) {
      console.log('--- Article 27 ---');
      console.log('HAS contentHtml:', !!a.contentHtml);
      if (a.contentHtml) {
        console.log('contentHtml snippet:', a.contentHtml.substring(0, 500));
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
