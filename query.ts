import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.article.findMany({ where: { articleNumber: 32 } });
  for (const art of articles) {
    if (art.contentHtml?.includes('P(합격)')) {
      console.log('contentHtml:', art.contentHtml);
      console.log('contentText:', art.contentText);
    }
  }
}
main().finally(() => prisma.$disconnect());
