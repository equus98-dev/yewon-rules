const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rule = await prisma.rule.findFirst({
    where: { title: '사무분장 규정' },
    include: {
      revisions: {
        orderBy: { version: 'desc' },
        take: 1,
        include: {
          articles: true
        }
      }
    }
  });

  if (rule && rule.revisions[0]) {
    const arts = rule.revisions[0].articles.filter(a => a.text.includes('21. 유학생'));
    for (const a of arts) {
       console.log("Found text length:", a.text.length);
       const idx = a.text.indexOf('21. 유학생');
       const substr = a.text.substring(idx - 10, idx + 20);
       console.log("Substring:", substr);
       console.log("Hex:", Buffer.from(substr).toString('hex').match(/../g).join(' '));
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
