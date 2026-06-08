const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.article.findMany({
    where: {
      OR: [
        { chapter: { contains: '운영' } },
        { section: { contains: '운영' } },
        { title: { contains: '운영' } },
        { contentText: { contains: '운영' } }
      ]
    }
  });

  console.log(`Found ${articles.length} articles`);
  
  for (const a of articles) {
    if (a.chapter && a.chapter.includes('폐지')) {
      console.log('Chapter match:', a.chapter);
      if (a.chapter.includes('설치') && a.chapter.includes('운영')) {
        const fixed = a.chapter.replace(/설치.운영.폐지/g, '설치·운영·폐지');
        console.log(`Fixing chapter in article ${a.id}: ${a.chapter} -> ${fixed}`);
        await prisma.article.update({
          where: { id: a.id },
          data: { chapter: fixed }
        });
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
