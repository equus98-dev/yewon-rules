import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import "dotenv/config";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

interface ContentItem {
  type: string;
  num: string;
  text: string;
}

function parseRuleText(rawText: string): ContentItem[] {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const items: ContentItem[] = [];

  for (let line of lines) {
    // kordoc outputs ### for headings
    line = line.replace(/^#+\s*/, "").trim();

    if (line.match(/^제\s*\d+\s*장\s/)) {
      items.push({ type: "chapter", num: "", text: line });
    } else if (line.match(/^제\s*\d+\s*절\s/)) {
      items.push({ type: "section", num: "", text: line });
    } else if (line.match(/^제\s*\d+\s*(의\s*\d+)?\s*조(\(.*\))?/)) {
      // 제1조(목적) 이 법인은...
      const match = line.match(/^(제\s*\d+\s*(?:의\s*\d+)?\s*조(?:\([^)]+\))?)\s*(.*)/);
      if (match) {
        items.push({ type: "article", num: match[1], text: match[2] });
      } else {
        items.push({ type: "article", num: "", text: line });
      }
    } else if (line.match(/^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]/)) {
      const match = line.match(/^([①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳])\s*(.*)/);
      if (match) {
        items.push({ type: "paragraph", num: match[1], text: match[2] });
      } else {
        items.push({ type: "paragraph", num: "", text: line });
      }
    } else if (line.match(/^\d+\./)) {
      const match = line.match(/^(\d+\.)\s*(.*)/);
      if (match) {
        items.push({ type: "item", num: match[1], text: match[2] });
      } else {
        items.push({ type: "item", num: "", text: line });
      }
    } else if (line.match(/^[가-하]\./)) {
      const match = line.match(/^([가-하]\.)\s*(.*)/);
      if (match) {
        items.push({ type: "subitem", num: match[1], text: match[2] });
      } else {
        items.push({ type: "subitem", num: "", text: line });
      }
    } else {
      // 일반 텍스트는 이전 요소에 합치거나 일반 문단으로 추가
      // 일단 일반 텍스트로 추가
      items.push({ type: "text", num: "", text: line });
    }
  }

  return items;
}

async function main() {
  console.log("HWP/HWPX 조문 구조화 추출 시작...");

  const sourceDir = path.join(__dirname, "../docs/rules");
  const files = fs.readdirSync(sourceDir);
  
  let successCount = 0;
  let failCount = 0;

  for (const file of files) {
    if (!file.endsWith(".hwp") && !file.endsWith(".hwpx")) continue;

    const match = file.match(/^([\d-]+)\s+(.+)\.(hwpx?)$/i);
    if (!match) continue;
    
    const ruleNumber = match[1];
    
    const rule = await prisma.rule.findUnique({
      where: { ruleNumber },
      include: { revisions: { include: { articles: true } } },
    });
    
    if (!rule || rule.revisions.length === 0) continue;
    
    const filePath = path.join(sourceDir, file);
    console.log(`[처리중] ${ruleNumber} - 추출 및 조문 분리 중...`);
    
    try {
      const markdownBuffer = execSync(`npx kordoc "${filePath}"`, { stdio: ['pipe', 'pipe', 'pipe'] });
      const rawText = markdownBuffer.toString('utf8');
      
      const structuredItems = parseRuleText(rawText);
      
      const revision = rule.revisions[0];
      const article = revision.articles[0];
      
      if (article) {
        await prisma.article.update({
          where: { id: article.id },
          data: {
            title: "규정 전문",
            contentText: rawText,
            contentJson: structuredItems as any,
          }
        });
        successCount++;
        console.log(`✅ [성공] ${ruleNumber} 구조화 변환 완료 (총 ${structuredItems.length}개 블록)`);
      }
    } catch (e: any) {
      failCount++;
      console.error(`❌ [실패] ${ruleNumber} 변환 오류: ${e.message}`);
    }
  }

  console.log(`\n작업 완료! 성공: ${successCount}, 실패: ${failCount}`);
}

main()
  .catch((e) => {
    console.error("Fatal Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
