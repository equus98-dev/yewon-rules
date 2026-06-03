const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const revisions = await prisma.revision.findMany({
    where: { revisionType: 'ENACTMENT' },
    include: {
      rule: true,
      articles: {
        where: { articleNumber: { gte: 8000, lt: 9000 } },
        orderBy: { articleNumber: 'asc' }
      }
    }
  });

  let updatedCount = 0;

  for (const rev of revisions) {
    // 2026년에 생성된 임시 날짜인지 확인 (실제 2026년에 제정된 규정이 없을 것이라 가정, 특히 6월 1일)
    if (rev.enactmentDate.getFullYear() === 2026 && rev.enactmentDate.getMonth() === 5) {
      if (rev.articles.length > 0) {
        const addendum = rev.articles[0].contentJson;
        let foundDate = null;

        // 1. "부 칙(YYYY. MM. DD)" 형태 찾기
        const titleRegex = /부\s*칙\s*\(\s*(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?\s*\)/;
        for (const item of addendum) {
          if (item.text) {
             const match = item.text.match(titleRegex);
             if (match) {
               foundDate = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
               break;
             }
          }
        }

        // 2. "YYYY년 M월 D일" 형태 찾기 (시행일)
        if (!foundDate) {
          const bodyRegex = /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/;
          for (const item of addendum) {
            if (item.text) {
               const match = item.text.match(bodyRegex);
               if (match) {
                 foundDate = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
                 break;
               }
            }
          }
        }
        
        // 3. "YYYY. M. D" 형태 찾기 (시행일 텍스트 내에 있을 경우)
        if (!foundDate) {
           const dotRegex = /(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?/;
           for (const item of addendum) {
             if (item.text && String(item.text).includes("시행")) {
                const match = item.text.match(dotRegex);
                if (match) {
                  foundDate = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
                  break;
                }
             }
           }
        }

        if (foundDate && !isNaN(foundDate.getTime())) {
          console.log(`Updating ${rev.rule.title}... Found Date: ${foundDate.toISOString().split('T')[0]}`);
          // DB 업데이트
          await prisma.revision.update({
             where: { id: rev.id },
             data: {
               enactmentDate: foundDate,
               effectiveDate: foundDate
             }
          });
          updatedCount++;
        } else {
          console.log(`Could not find date for ${rev.rule.title} in addendum.`);
        }
      } else {
        console.log(`No addendum found for ${rev.rule.title}.`);
      }
    }
  }

  console.log(`Successfully updated ${updatedCount} revisions.`);
}

main().catch(console.error).finally(() => {
    prisma.$disconnect();
});
