const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const a = await prisma.article.findFirst({
    where: { articleNumber: '제5조', revision: { rule: { title: { contains: 'RISE' } } } }
  });
  console.log(a.contentHtml);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
