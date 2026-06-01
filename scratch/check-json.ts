import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

async function main() {
  const rule = await prisma.rule.findUnique({
    where: { ruleNumber: "2-0-2" },
    include: { revisions: { include: { articles: true } } },
  });
  
  const article = rule?.revisions[0]?.articles[0];
  if (article) {
    console.log("TITLE:", article.title);
    console.log("ARTICLE NUMBER:", article.articleNumber);
    console.log("JSON:", JSON.stringify(article.contentJson).substring(0, 500));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
