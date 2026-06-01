import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

// Helper to get Korean initial sound
function getInitialSound(text: string): string {
  if (!text) return "ㄱ";
  const char = text.trim().charAt(0);
  const code = char.charCodeAt(0) - 0xac00;
  if (code >= 0 && code < 11172) {
    const chosungList = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
    return chosungList[Math.floor(code / 588)];
  }
  return char.toUpperCase();
}

const CATEGORY_MAP: Record<string, { name: string, dept: string }> = {
  "1-0": { name: "제1편 학교법인", dept: "법인사무처" },
  "2-0": { name: "제2편 대학헌장 및 학칙", dept: "교무처" },
  "3-1": { name: "제3편 대학운영 (제1장 행정)", dept: "기획처" },
  "3-2": { name: "제3편 대학운영 (제2장 인사)", dept: "총무처" },
  "3-3": { name: "제3편 대학운영 (제3장 학사)", dept: "교무처" },
  "3-4": { name: "제3편 대학운영 (제4장 학생)", dept: "학생처" },
  "3-5": { name: "제3편 대학운영 (제5장 재무 및 연구)", dept: "기획처" },
  "4-0": { name: "제4편 제위원회", dept: "기획처" },
  "5-1": { name: "제5편 부속/부설기관 (제1장 부속기관)", dept: "기획처" },
  "5-2": { name: "제5편 부속/부설기관 (제2장 부설연구소)", dept: "산학협력단" },
  "6-0": { name: "제6편 산학협력단", dept: "산학협력단" },
  "7-0": { name: "제7편 학생회 및 기타", dept: "학생처" },
};

async function getOrCreateCategory(catInfo: { name: string, dept: string }) {
  let category = await prisma.category.findFirst({ where: { name: catInfo.name } });
  if (!category) {
    // Determine depth and order based on name loosely
    const sortOrder = parseInt(catInfo.name.replace(/[^0-9]/g, "").substring(0,1)) || 99;
    category = await prisma.category.create({
      data: { name: catInfo.name, depth: 1, sortOrder },
    });
  }
  return category;
}

async function getOrCreateDept(name: string) {
  let dept = await prisma.department.findFirst({ where: { name } });
  if (!dept) {
    dept = await prisma.department.create({
      data: { name, sortOrder: 10 },
    });
  }
  return dept;
}

async function main() {
  console.log("전체 규정 데이터 일괄 입력 시작...");

  const sourceDir = path.join(__dirname, "../docs/rules");
  const targetDir = path.join(__dirname, "../public/files/rules");

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const files = fs.readdirSync(sourceDir);
  let successCount = 0;

  for (const file of files) {
    if (!file.endsWith(".hwp") && !file.endsWith(".hwpx")) continue;

    // 파싱: "1-0-1   학교법인 예원예술대학교 정관.hwp" -> "1-0-1", "학교법인 예원예술대학교 정관"
    const match = file.match(/^([\d-]+)\s+(.+)\.(hwpx?)$/i);
    let ruleNumber = "";
    let title = "";
    let ext = "";
    
    if (match) {
      ruleNumber = match[1];
      title = match[2].trim();
      ext = match[3].toLowerCase();
    } else {
      // 패턴 매칭 실패 시 임의로 생성 (예: "장기근속수당 기준표.hwp")
      ruleNumber = `9-9-${Date.now().toString().slice(-4)}`;
      title = file.replace(/\.hwpx?$/i, "").trim();
      ext = file.split('.').pop()?.toLowerCase() || 'hwp';
    }

    const prefixMatch = ruleNumber.match(/^(\d+-\d+)/);
    const prefix = prefixMatch ? prefixMatch[1] : "9-9";
    
    const catInfo = CATEGORY_MAP[prefix] || { name: "기타 규정", dept: "기획처" };

    const category = await getOrCreateCategory(catInfo);
    const dept = await getOrCreateDept(catInfo.dept);

    console.log(`[처리중] ${ruleNumber} : ${title} (${catInfo.name})`);

    // 기존 데이터 있으면 삭제
    const existing = await prisma.rule.findUnique({ where: { ruleNumber } });
    if (existing) {
      await prisma.rule.delete({ where: { ruleNumber } });
    }

    // 파일 복사
    const sourcePath = path.join(sourceDir, file);
    // URL-safe 파일명 또는 원본 파일명 유지. 원본은 띄어쓰기가 많으므로 ruleNumber 기반으로 저장
    const targetFileName = `${ruleNumber}_${title.replace(/\s+/g, "_")}.${ext}`;
    const targetPath = path.join(targetDir, targetFileName);
    fs.copyFileSync(sourcePath, targetPath);

    // Rule 생성
    const rule = await prisma.rule.create({
      data: {
        title,
        ruleNumber,
        initialSound: getInitialSound(title),
        status: "EFFECTIVE",
        categoryId: category.id,
        departmentId: dept.id,
      },
    });

    // Revision 생성
    const revision = await prisma.revision.create({
      data: {
        ruleId: rule.id,
        version: 1,
        versionName: "현행본",
        revisionType: "ENACTMENT",
        enactmentDate: new Date(),
        effectiveDate: new Date(),
        announcementNumber: "-",
        description: "일괄 등록된 현행 규정입니다.",
      },
    });

    // Article 생성 (더미 조항)
    await prisma.article.create({
      data: {
        revisionId: revision.id,
        chapter: "본문",
        section: null,
        articleNumber: 1,
        title: "규정 본문",
        contentJson: [
          { type: "paragraph", num: "", text: "본 규정의 상세 내용은 첨부된 원본 파일을 다운로드하여 확인하시기 바랍니다." },
        ],
        contentText: "본 규정의 상세 내용은 첨부된 원본 파일을 다운로드하여 확인하시기 바랍니다.",
        sortOrder: 1,
      },
    });

    // Attachment 생성
    const stats = fs.statSync(sourcePath);
    await prisma.attachment.create({
      data: {
        ruleId: rule.id,
        title: file,
        fileUrl: `/files/rules/${encodeURIComponent(targetFileName)}`,
        fileSize: stats.size,
        fileType: ext,
      },
    });

    successCount++;
  }

  console.log(`\n✅ 총 ${successCount}개의 규정이 성공적으로 등록되었습니다.`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
