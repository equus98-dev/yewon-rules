import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.article.findMany();
  
  let found = 0;
  for (const a of articles) {
    if (a.contentText) {
      // Find [①-⑳] that are NOT preceded by newline, start of string, or > (for HTML tags) or space
      // Actually, just find any [①-⑳] that is preceded by a non-space character (excluding > and .)
      const matches = a.contentText.match(/[^> \n\r.\]][①-⑳]/g);
      if (matches) {
        console.log(`Found glued circle number in Article: ${a.articleNum}`);
        console.log(`Snippet: ...${a.contentText.substring(Math.max(0, a.contentText.indexOf(matches[0]) - 20), a.contentText.indexOf(matches[0]) + 20)}...`);
        found++;
      }
    }
  }
  console.log(`Total glued circle numbers found: ${found}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
