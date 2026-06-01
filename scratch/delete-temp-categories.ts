import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

async function main() {
  const categoriesToDelete = ["대학현황", "행정규정", "기타규정", "대학 현황", "행정 규정", "기타 규정"];
  
  for (const name of categoriesToDelete) {
    const categories = await prisma.category.findMany({
      where: { name: { contains: name } },
      include: { children: true },
    });
    
    for (const category of categories) {
      console.log(`Deleting rules for category and children: ${category.name}`);
      
      const childIds = category.children.map(c => c.id);
      const allIds = [category.id, ...childIds];
      
      await prisma.rule.deleteMany({
        where: { categoryId: { in: allIds } },
      });
      
      console.log(`Deleting category: ${category.name}`);
      await prisma.category.delete({
        where: { id: category.id },
      });
    }
  }
  
  const allCategories = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' }});
  console.log("\nRemaining categories:");
  allCategories.forEach(c => console.log(`- ${c.name}`));
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
