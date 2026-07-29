const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const rule = await prisma.rule.findFirst({
      where: { title: { contains: '통합예술치유연구소' } }
    });
    if (!rule) {
      console.log('Rule not found.');
      return;
    }
    console.log('Rule:', rule);

    const rev = await prisma.revision.findFirst({
      where: { ruleId: rule.id },
      orderBy: { version: 'asc' }
    });
    if (!rev) {
      console.log('Revision not found.');
      return;
    }
    console.log('Revision:', rev);

    // Prisma doesn't easily support 'title = "[전문] " || title' in updateMany, so we fetch and update individually
    const attachments = await prisma.attachment.findMany({
      where: { ruleId: rule.id, NOT: { title: { startsWith: '[전문]' } } }
    });

    let count = 0;
    for (const att of attachments) {
      await prisma.attachment.update({
        where: { id: att.id },
        data: {
          revisionId: rev.id,
          title: '[전문] ' + att.title
        }
      });
      count++;
    }
    
    console.log('Attachments updated:', count);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
