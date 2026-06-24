const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const rule = await prisma.rule.findFirst({
    where: { title: { contains: '일반대학원 학사운영' } },
    include: { currentRevision: true }
  });
  if (!rule) { console.log('NOT FOUND'); return; }
  const rev = rule.currentRevision;
  const json = JSON.parse(rev.contentJson || '{}');
  const items = json.items || [];
  // Find article 33 items
  const art33items = items.filter(i => (i.num && i.num.includes('33')) || (i.body && i.body.includes('학점당')));
  console.log(JSON.stringify(art33items, null, 2));
}
run().catch(e => { console.error(e); }).finally(() => prisma.$disconnect());
