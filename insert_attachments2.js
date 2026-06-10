const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function run() {
  const rule = await prisma.rule.findFirst({
    where: { ruleNumber: '3-1-4' }
  });
  console.log(rule);
  
  const hwpName = '[별표] 위임전결권 구분표.hwp';
  const pdfName = '[별표] 위임전결권 구분표.pdf';

  // We'll just fake the fileUrl since we are not uploading to R2 here, but we will copy them to public folder for testing
  fs.copyFileSync('docs/rules/별지 및 별표 모음/3-1-4 [별표] 위임전결권 구분표.hwp', 'public/' + hwpName);
  fs.copyFileSync('docs/rules/별지 및 별표 모음/3-1-4 [별표] 위임전결권 구분표.pdf', 'public/' + pdfName);

  await prisma.attachment.upsert({
    where: { id: 'uuid1111-1111-1111-1111-111111111111' },
    update: {},
    create: {
      id: 'uuid1111-1111-1111-1111-111111111111',
      ruleId: rule.id,
      title: hwpName,
      fileUrl: '/' + hwpName,
      fileSize: 147456,
      fileType: 'HWP'
    }
  });

  await prisma.attachment.upsert({
    where: { id: 'uuid2222-2222-2222-2222-222222222222' },
    update: {},
    create: {
      id: 'uuid2222-2222-2222-2222-222222222222',
      ruleId: rule.id,
      title: pdfName,
      fileUrl: '/' + pdfName,
      fileSize: 239500,
      fileType: 'PDF'
    }
  });

  console.log('Inserted!');
  await prisma.$disconnect();
}
run();
