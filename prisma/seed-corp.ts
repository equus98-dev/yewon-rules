/**
 * 제1편 학교법인 규정 데이터 입력 스크립트
 * 실행: npx tsx prisma/seed-corp.ts
 * 
 * 이미지 구조:
 * 제 1 편 학교법인
 *   ├─ 1-0-1 학교법인 예원예술대학교 정관
 *   ├─ 1-0-2 학교법인 예원예술대학교 정관 시행규정
 *   ├─ 1-0-3 대학발전협의회 규정
 *   ├─ 1-0-4 교원 징계규정
 *   ├─ 1-0-5 일반직원 징계규정
 *   └─ 1-0-6 학교법인 감사규정
 */

import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

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

async function main() {
  console.log("제1편 학교법인 규정 데이터 입력 시작...");

  // ─── 1. 기존 데이터 정리 ───
  // 기존에 동일 ruleNumber가 있을 수 있으니 먼저 확인 후 삭제
  const existingNumbers = ["1-0-1", "1-0-2", "1-0-3", "1-0-4", "1-0-5", "1-0-6"];
  for (const num of existingNumbers) {
    const existing = await prisma.rule.findUnique({ where: { ruleNumber: num } });
    if (existing) {
      console.log(`  기존 규정 삭제: ${num}`);
      // 연관 데이터는 cascade로 자동 삭제됨
      await prisma.rule.delete({ where: { ruleNumber: num } });
    }
  }

  // ─── 2. 부서 확인 / 생성 ───
  let deptCorp = await prisma.department.findFirst({ where: { name: "법인사무처" } });
  if (!deptCorp) {
    deptCorp = await prisma.department.create({
      data: { name: "법인사무처", code: "CORP01", sortOrder: 10 },
    });
    console.log("  부서 생성: 법인사무처");
  }

  // ─── 3. 카테고리 확인 / 생성 ───
  // "제1편 학교법인" 최상위 카테고리
  let catCorp = await prisma.category.findFirst({ where: { name: "제1편 학교법인" } });
  if (!catCorp) {
    catCorp = await prisma.category.create({
      data: { name: "제1편 학교법인", depth: 1, sortOrder: 0 },
    });
    console.log("  카테고리 생성: 제1편 학교법인");
  }

  // ─── 4. 6개 규정 입력 ───

  const rules = [
    {
      ruleNumber: "1-0-1",
      title: "학교법인 예원예술대학교 정관",
      enactDate: "1988-03-15",
      versionName: "제정",
      revisionType: "ENACTMENT",
      announcementNumber: "1-0-1호",
      description: "학교법인 예원예술대학교 설립에 따른 정관 최초 제정",
      articleTitle: "목적",
      articleContent: "이 정관은 학교법인 예원예술대학교(이하 \"법인\"이라 한다)의 조직과 운영에 관한 기본사항을 규정함을 목적으로 한다.",
      attachmentTitle: "1-0-1 학교법인 예원예술대학교 정관",
    },
    {
      ruleNumber: "1-0-2",
      title: "학교법인 예원예술대학교 정관 시행규정",
      enactDate: "1988-05-01",
      versionName: "제정",
      revisionType: "ENACTMENT",
      announcementNumber: "1-0-2호",
      description: "학교법인 정관의 세부 시행에 관한 규정 제정",
      articleTitle: "목적",
      articleContent: "이 규정은 학교법인 예원예술대학교 정관의 시행에 필요한 세부 사항을 규정함을 목적으로 한다.",
      attachmentTitle: "1-0-2 학교법인 예원예술대학교 정관 시행규정",
    },
    {
      ruleNumber: "1-0-3",
      title: "대학발전협의회 규정",
      enactDate: "2005-03-01",
      versionName: "제정",
      revisionType: "ENACTMENT",
      announcementNumber: "1-0-3호",
      description: "대학발전협의회 구성 및 운영에 관한 규정 제정",
      articleTitle: "목적",
      articleContent: "이 규정은 예원예술대학교 대학발전협의회의 구성, 운영 및 기능에 관한 사항을 규정함을 목적으로 한다.",
      attachmentTitle: "1-0-3 대학발전협의회 규정",
    },
    {
      ruleNumber: "1-0-4",
      title: "교원 징계규정",
      enactDate: "1990-01-01",
      versionName: "제정",
      revisionType: "ENACTMENT",
      announcementNumber: "1-0-4호",
      description: "교원 징계절차 및 기준에 관한 규정 제정",
      articleTitle: "목적",
      articleContent: "이 규정은 예원예술대학교 교원의 징계에 관한 사항을 규정함을 목적으로 한다.",
      attachmentTitle: "1-0-4 교원 징계규정",
    },
    {
      ruleNumber: "1-0-5",
      title: "일반직원 징계규정",
      enactDate: "1990-01-01",
      versionName: "제정",
      revisionType: "ENACTMENT",
      announcementNumber: "1-0-5호",
      description: "일반직원 징계절차 및 기준에 관한 규정 제정",
      articleTitle: "목적",
      articleContent: "이 규정은 예원예술대학교 일반직원의 징계에 관한 사항을 규정함을 목적으로 한다.",
      attachmentTitle: "1-0-5 일반직원 징계규정",
    },
    {
      ruleNumber: "1-0-6",
      title: "학교법인 감사규정",
      enactDate: "1992-03-01",
      versionName: "제정",
      revisionType: "ENACTMENT",
      announcementNumber: "1-0-6호",
      description: "학교법인 감사의 직무 및 감사절차에 관한 규정 제정",
      articleTitle: "목적",
      articleContent: "이 규정은 학교법인 예원예술대학교 감사의 직무와 감사절차 등에 관한 사항을 규정함을 목적으로 한다.",
      attachmentTitle: "1-0-6 학교법인 감사규정",
    },
  ];

  for (const r of rules) {
    console.log(`  규정 입력 중: ${r.ruleNumber} ${r.title}`);

    // Rule 생성
    const rule = await prisma.rule.create({
      data: {
        title: r.title,
        ruleNumber: r.ruleNumber,
        initialSound: getInitialSound(r.title),
        status: "EFFECTIVE",
        categoryId: catCorp.id,
        departmentId: deptCorp.id,
      },
    });

    // Revision 생성
    const enactDate = new Date(r.enactDate);
    const revision = await prisma.revision.create({
      data: {
        ruleId: rule.id,
        version: 1,
        versionName: r.versionName,
        revisionType: r.revisionType,
        enactmentDate: enactDate,
        effectiveDate: enactDate,
        announcementNumber: r.announcementNumber,
        description: r.description,
      },
    });

    // Article 생성 (제1조 목적)
    await prisma.article.create({
      data: {
        revisionId: revision.id,
        chapter: "제1장 총칙",
        section: null,
        articleNumber: 1,
        title: r.articleTitle,
        contentJson: [
          { type: "paragraph", num: "①", text: r.articleContent },
        ],
        contentText: r.articleContent,
        sortOrder: 1,
      },
    });

    // Attachment 생성 (다운로드 링크 - 실제 파일 URL은 나중에 업데이트 가능)
    await prisma.attachment.create({
      data: {
        ruleId: rule.id,
        title: r.attachmentTitle,
        fileUrl: `/files/${r.ruleNumber}.hwp`,
        fileType: "hwp",
      },
    });

    console.log(`    ✓ 완료: ${r.title}`);
  }

  console.log("\n✅ 제1편 학교법인 6개 규정 입력 완료!");
  console.log("   카테고리: 제1편 학교법인");
  console.log("   부서: 법인사무처");
  console.log("   규정: 1-0-1 ~ 1-0-6");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
