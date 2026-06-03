const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rules = await prisma.rule.findMany({
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

  console.log('Found', rules.length, 'rules called 사무분장 규정');
  for (const r of rules) {
    console.log(r.id, r.departmentId);
    if (r.revisions[0]) {
      const art = r.revisions[0].articles.find(a => a.text && a.text.includes('유학생 오리엔테이션'));
      if (art) console.log('Found in rule', r.id, 'article', art.num);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
