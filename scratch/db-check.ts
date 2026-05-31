import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  console.log("--- DB 전체 규정 및 조항 현황 검증 ---");
  
  const rules = await prisma.rule.findMany({
    include: {
      revisions: {
        include: {
          _count: {
            select: { articles: true }
          }
        }
      }
    }
  });

  console.log(`총 규정 수: ${rules.length}개\n`);
  for (const r of rules) {
    console.log(`[규정] ID: ${r.id}`);
    console.log(`  - 제목: ${r.title}`);
    console.log(`  - 번호: ${r.ruleNumber}`);
    console.log(`  - 상태: ${r.status}`);
    console.log(`  - 연혁 및 조항 수:`);
    for (const rev of r.revisions) {
      console.log(`    * [버전] ${rev.versionName} (차수: ${rev.version}) -> 조항 수: ${rev._count.articles}개`);
    }
    console.log("-----------------------------------------");
  }
}

main()
  .catch((e) => {
    console.error("Error:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
