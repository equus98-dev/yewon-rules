const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rule = await prisma.rule.findFirst({
    where: { ruleNumber: '2-0-2' },
    include: { revisions: { include: { articles: true } } }
  });
  
  if (!rule) {
    console.log('Rule not found');
    return;
  }
  
  const currentRevision = rule.revisions.find(r => r.status === 'CURRENT') || rule.revisions[0];
  const articles = currentRevision.articles;
  const addendum = articles.find(a => a.articleNumber >= 8000 || a.title === '부' || a.title === '부칙' || (a.title && a.title.includes('부')));
  
  console.log('TITLE:', addendum.title);
  console.log('CONTENT_HTML:', addendum.contentHtml);
  console.log('CONTENT_TEXT:', addendum.contentText);
  
  const rule1 = await prisma.rule.findFirst({
    where: { ruleNumber: '1-0-1' },
    include: { revisions: { include: { articles: true } } }
  });
  const currentRevision1 = rule1.revisions.find(r => r.status === 'CURRENT') || rule1.revisions[0];
  const addendum1 = currentRevision1.articles.find(a => a.articleNumber >= 8000 || a.title === '부' || a.title === '부칙' || (a.title && a.title.includes('부')));
  console.log('RULE 1-0-1 TITLE:', addendum1.title);
  console.log('RULE 1-0-1 CONTENT_HTML:', addendum1.contentHtml);
}

main().catch(console.error).finally(() => prisma.$disconnect());
