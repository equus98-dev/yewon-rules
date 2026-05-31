import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log("실제 예원예술대학교 규정 데이터 인입을 시작합니다...");

  // 1. 기존 데이터 초기화 (외래키 제약조건 고려하여 역순 삭제)
  await prisma.notice.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.articleComparison.deleteMany();
  await prisma.article.deleteMany();
  await prisma.revision.deleteMany();
  await prisma.rule.deleteMany();
  await prisma.department.deleteMany();
  await prisma.category.deleteMany();

  console.log("기존 데이터 초기화 완료.");

  // 2. 소관부서 생성
  const deptAcademic = await prisma.department.create({
    data: { name: "교학지원처", code: "DEPT01", sortOrder: 1 },
  });
  const deptPlanning = await prisma.department.create({
    data: { name: "기획조정처", code: "DEPT02", sortOrder: 2 },
  });
  const deptAdmin = await prisma.department.create({
    data: { name: "행정지원처", code: "DEPT03", sortOrder: 3 },
  });

  console.log("예원예술대 부서 생성 완료.");

  // 3. 카테고리 트리 생성
  const catUniv = await prisma.category.create({
    data: { name: "대학현황", depth: 1, sortOrder: 1 },
  });
  const catRule = await prisma.category.create({
    data: { name: "대학규정", depth: 2, sortOrder: 1, parentId: catUniv.id },
  });
  const catAcademicReg = await prisma.category.create({
    data: { name: "학사행정규정", depth: 2, sortOrder: 2, parentId: catUniv.id },
  });

  const catAdmin = await prisma.category.create({
    data: { name: "행정규정", depth: 1, sortOrder: 2 },
  });
  const catPersonnel = await prisma.category.create({
    data: { name: "인사 및 복무규정", depth: 2, sortOrder: 1, parentId: catAdmin.id },
  });

  console.log("카테고리 트리 생성 완료.");

  // 4. [실제 데이터] 예원예술대학교 학칙 등록
  const ruleAcademic = await prisma.rule.create({
    data: {
      title: "예원예술대학교 학칙",
      ruleNumber: "제1호",
      initialSound: "ㅇ",
      status: "EFFECTIVE",
      categoryId: catRule.id,
      departmentId: deptAcademic.id,
    },
  });

  // 4-1) 학칙 V1: 최초 제정 (2024-03-01)
  const revAcademicV1 = await prisma.revision.create({
    data: {
      ruleId: ruleAcademic.id,
      version: 1,
      versionName: "제정",
      revisionType: "ENACTMENT",
      enactmentDate: new Date("2024-03-01"),
      effectiveDate: new Date("2024-03-01"),
      announcementNumber: "제1호",
      description: "캠퍼스 설립에 따른 최초 학칙 구성 및 편제 확정 건",
    },
  });

  // V1 조항들
  const artV1_1 = await prisma.article.create({
    data: {
      revisionId: revAcademicV1.id,
      chapter: "제1장 총칙",
      section: null,
      articleNumber: 1,
      title: "목적",
      contentJson: [
        { type: "paragraph", num: "①", text: "이 학칙은 예원예술대학교(이하 “본교”라 한다)의 교육목적을 달성하기 위한 학사조직과 운영 전반에 관한 모든 사항을 규정함을 목적으로 한다." }
      ],
      contentText: "이 학칙은 예원예술대학교(이하 “본교”라 한다)의 교육목적을 달성하기 위한 학사조직과 운영 전반에 관한 모든 사항을 규정함을 목적으로 한다.",
      sortOrder: 1,
    },
  });

  const artV1_2 = await prisma.article.create({
    data: {
      revisionId: revAcademicV1.id,
      chapter: "제1장 총칙",
      section: null,
      articleNumber: 2,
      title: "교육목표",
      contentJson: [
        { type: "paragraph", num: "①", text: "본교는 대한민국의 교육이념에 입각하여 인간으로서 자질과 품격을 도야하며 특히 예술에 관한 전문지식과 재능을 개발 연마하여 우리의 정신문화 창달에 기여 공헌할 전문 예술인의 양성을 교육목표로 한다." }
      ],
      contentText: "본교는 대한민국의 교육이념에 입각하여 인간으로서 자질과 품격을 도야하며 특히 예술에 관한 전문지식과 재능을 개발 연마하여 우리의 정신문화 창달에 기여 공헌할 전문 예술인의 양성을 교육목표로 한다.",
      sortOrder: 2,
    },
  });

  const artV1_3 = await prisma.article.create({
    data: {
      revisionId: revAcademicV1.id,
      chapter: "제2장 편제",
      section: null,
      articleNumber: 3,
      title: "편제",
      contentJson: [
        { type: "paragraph", num: "①", text: "본교의 편제는 전북희망캠퍼스와 경기드림캠퍼스에 설치된 학부(과) 및 전공을 명시하며 세부 사항은 이사장과 총장이 정한다." }
      ],
      contentText: "본교의 편제는 전북희망캠퍼스와 경기드림캠퍼스에 설치된 학부(과) 및 전공을 명시하며 세부 사항은 이사장과 총장이 정한다.",
      sortOrder: 3,
    },
  });

  // 4-2) 학칙 V2: 개정 (2026-03-01) - 실제 개정된 목적문 및 편제(국제매니지먼트학부, 글로벌문화예술경영학부 등 반영)
  const revAcademicV2 = await prisma.revision.create({
    data: {
      ruleId: ruleAcademic.id,
      version: 2,
      versionName: "제15차 일부개정",
      revisionType: "AMENDMENT",
      enactmentDate: new Date("2026-03-01"),
      effectiveDate: new Date("2026-03-01"),
      announcementNumber: "제84호",
      description: "교육이념 세분화 명시화 및 신설 글로벌 학부(국제매니지먼트학부, 글로벌문화예술경영학부) 편제 편입을 위한 일부개정",
    },
  });

  // V2 조항들
  const artV2_1 = await prisma.article.create({
    data: {
      revisionId: revAcademicV2.id,
      chapter: "제1장 총칙",
      section: null,
      articleNumber: 1,
      title: "목적",
      contentJson: [
        { type: "paragraph", num: "①", text: "이 학칙은 예원예술대학교(이하 “본교”라 한다)의 교육목적을 국민정서와 함께 지성과 감성을 겸비한 조화로운 인간의 육성에 기여하고자 문화예술분야를 선도할 '창조적이고 실천적인 전인적 인간양성'으로 정하고 이를 달성하기 위한 학사조직과 운영 전반에 관한 모든 사항을 규정함을 목적으로 한다." }
      ],
      contentText: "이 학칙은 예원예술대학교(이하 “본교”라 한다)의 교육목적을 국민정서와 함께 지성과 감성을 겸비한 조화로운 인간의 육성에 기여하고자 문화예술분야를 선도할 '창조적이고 실천적인 전인적 인간양성'으로 정하고 이를 달성하기 위한 학사조직과 운영 전반에 관한 모든 사항을 규정함을 목적으로 한다.",
      sortOrder: 1,
    },
  });

  const artV2_2 = await prisma.article.create({
    data: {
      revisionId: revAcademicV2.id,
      chapter: "제1장 총칙",
      section: null,
      articleNumber: 2,
      title: "교육목표",
      contentJson: [
        { type: "paragraph", num: "①", text: "본교는 대한민국의 교육이념에 입각하여 인간으로서 자질과 품격을 도야하며 특히 예술에 관한 전문지식과 재능을 개발 연마하여 우리의 정신문화 창달에 기여 공헌할 전문 예술인의 양성을 교육목표로 한다." }
      ],
      contentText: "본교는 대한민국의 교육이념에 입각하여 인간으로서 자질과 품격을 도야하며 특히 예술에 관한 전문지식과 재능을 개발 연마하여 우리의 정신문화 창달에 기여 공헌할 전문 예술인의 양성을 교육목표로 한다.",
      sortOrder: 2,
    },
  });

  const artV2_3 = await prisma.article.create({
    data: {
      revisionId: revAcademicV2.id,
      chapter: "제2장 편제",
      section: null,
      articleNumber: 3,
      title: "편제",
      contentJson: [
        { type: "paragraph", num: "①", text: "본교의 편제는 전북희망캠퍼스와 경기드림캠퍼스에 설치된 학부(과) 및 전공으로 구성한다." },
        { type: "paragraph", num: "②", text: "글로벌 교육 경쟁력 강화를 위하여 본교에 국제매니지먼트학부 및 글로벌문화예술경영학부를 설치하여 신입생을 선발한다. (신설 2026.03.01)" },
        { type: "paragraph", num: "③", text: "대학원 편제로는 일반대학원 외에 특수대학원인 문화예술대학원, 사회복지대학원을 둔다. (개정 2026.03.01)" }
      ],
      contentText: "본교의 편제는 전북희망캠퍼스와 경기드림캠퍼스에 설치된 학부(과) 및 전공으로 구성한다. 글로벌 교육 경쟁력 강화를 위하여 본교에 국제매니지먼트학부 및 글로벌문화예술경영학부를 설치하여 신입생을 선발한다. 대학원 편제로는 일반대학원 외에 특수대학원인 문화예술대학원, 사회복지대학원을 둔다.",
      sortOrder: 3,
    },
  });

  // 신구대비표 등록 (V2 기준)
  await prisma.articleComparison.create({
    data: {
      revisionId: revAcademicV2.id,
      beforeArticleId: artV1_1.id,
      afterArticleId: artV2_1.id,
      note: "창조적이고 실천적인 인재양성 등 교육목적 문구의 구체화",
    },
  });

  await prisma.articleComparison.create({
    data: {
      revisionId: revAcademicV2.id,
      beforeArticleId: artV1_3.id,
      afterArticleId: artV2_3.id,
      note: "국제매니지먼트학부 및 글로벌문화예술경영학부 신설, 일반/특수대학원 편제 세분화 명시 반영",
    },
  });

  // 첨부서식
  await prisma.attachment.create({
    data: {
      ruleId: ruleAcademic.id,
      title: "[별지 제1호] 예원예술대학교 학칙 전문(개정 제84호).pdf",
      fileUrl: "/files/yewon_rules_v84.pdf",
      fileSize: 312000,
      fileType: "pdf",
    },
  });

  console.log("학칙 규정 연혁 및 대비표 세트 생성 완료.");


  // 5. [실제 데이터] 예원예술대학교 장학 규정 등록
  const ruleScholar = await prisma.rule.create({
    data: {
      title: "장학금 지급 규정",
      ruleNumber: "제12호",
      initialSound: "ㅈ",
      status: "EFFECTIVE",
      categoryId: catAcademicReg.id,
      departmentId: deptAcademic.id,
    },
  });

  const revScholarV1 = await prisma.revision.create({
    data: {
      ruleId: ruleScholar.id,
      version: 1,
      versionName: "제정",
      revisionType: "ENACTMENT",
      enactmentDate: new Date("2024-03-01"),
      effectiveDate: new Date("2024-03-01"),
      announcementNumber: "제12호",
      description: "재학생 장학 수혜 기준과 장학 종류를 구체화하기 위한 규정 제정",
    },
  });

  await prisma.article.create({
    data: {
      revisionId: revScholarV1.id,
      chapter: "제1장 총칙",
      section: null,
      articleNumber: 1,
      title: "목적",
      contentJson: [
        { type: "paragraph", num: "①", text: "이 규정은 예원예술대학교 학생의 장학금 지급에 필요한 세부 자격요건, 지급절차 및 이중수혜 방지에 관한 사항을 정함을 목적으로 한다." }
      ],
      contentText: "이 규정은 예원예술대학교 학생의 장학금 지급에 필요한 세부 자격요건, 지급절차 및 이중수혜 방지에 관한 사항을 정함을 목적으로 한다.",
      sortOrder: 1,
    },
  });

  await prisma.article.create({
    data: {
      revisionId: revScholarV1.id,
      chapter: "제2장 장학금의 종류",
      section: null,
      articleNumber: 2,
      title: "장학금의 종류",
      contentJson: [
        { type: "paragraph", num: "①", text: "본교 학생에게 지급하는 장학금의 종류는 다음과 같다." },
        { type: "item", num: "1.", text: "예능장학금: 전공 실기 능력이 우수하며 타의 모범이 되는 학생에게 수혜" },
        { type: "item", num: "2.", text: "신입생 입학장학금: 신입생 중 최초합격자 중 우수 성적을 낸 자에게 지급" },
        { type: "item", num: "3.", text: "특별장학금: 보훈 대상자, 가계 곤란 극복자 또는 대학 공로자에게 선별 수혜" }
      ],
      contentText: "본교 학생에게 지급하는 장학금의 종류는 다음과 같다. 1. 예능장학금: 전공 실기 능력이 우수하며 타의 모범이 되는 학생에게 수혜 2. 신입생 입학장학금: 신입생 중 최초합격자 중 우수 성적을 낸 자에게 지급 3. 특별장학금: 보훈 대상자, 가계 곤란 극복자 또는 대학 공로자에게 선별 수혜",
      sortOrder: 2,
    },
  });

  await prisma.article.create({
    data: {
      revisionId: revScholarV1.id,
      chapter: "제3장 이중수혜",
      section: null,
      articleNumber: 3,
      title: "이중수혜의 제한",
      contentJson: [
        { type: "paragraph", num: "①", text: "모든 장학금은 등록금 총액 범위 내에서만 이중으로 수혜 받을 수 있다. 단, 근로장학금 및 특별 생활비 지원 목적의 장학은 한도 초과를 허용한다." }
      ],
      contentText: "모든 장학금은 등록금 총액 범위 내에서만 이중으로 수혜 받을 수 있다. 단, 근로장학금 및 특별 생활비 지원 목적의 장학은 한도 초과를 허용한다.",
      sortOrder: 3,
    },
  });

  // 첨부서식
  await prisma.attachment.create({
    data: {
      ruleId: ruleScholar.id,
      title: "[양식] 예원예술대학교 장학금 신청원 및 교사추천서.hwp",
      fileUrl: "/files/yewon_scholarship_form.hwp",
      fileSize: 48300,
      fileType: "hwp",
    },
  });

  console.log("장학 규정 생성 완료.");


  // 6. [신규 실제 데이터] 예원예술대학교 대학원 학칙 등록 (Docs 한글 파일 추출 데이터 기반)
  const ruleGraduate = await prisma.rule.create({
    data: {
      title: "대학원 학칙",
      ruleNumber: "제2-0-4호",
      initialSound: "ㄷ",
      status: "EFFECTIVE",
      categoryId: catRule.id,
      departmentId: deptAcademic.id,
    },
  });

  // 6-1) 대학원 학칙 V1: 제정 (2004-09-08)
  const revGradV1 = await prisma.revision.create({
    data: {
      ruleId: ruleGraduate.id,
      version: 1,
      versionName: "제정",
      revisionType: "ENACTMENT",
      enactmentDate: new Date("2004-09-08"),
      effectiveDate: new Date("2004-09-08"),
      announcementNumber: "제2-0-4호-제정",
      description: "일반대학원 및 석사과정 신설에 따른 최초 대학원 기본 규정 제정",
    },
  });

  const artGradV1_1 = await prisma.article.create({
    data: {
      revisionId: revGradV1.id,
      chapter: "제1장 총칙",
      section: null,
      articleNumber: 1,
      title: "목적",
      contentJson: [
        { type: "paragraph", num: "①", text: "이 학칙은 예원예술대학교(이하 \"이 대학교\"라 한다) 대학원의 교육목표를 설정하고 이를 달성하기 위한 학사운영, 교육과정 등에 관한 사항을 규정함을 목적으로 한다." }
      ],
      contentText: "이 학칙은 예원예술대학교(이하 \"이 대학교\"라 한다) 대학원의 교육목표를 설정하고 이를 달성하기 위한 학사운영, 교육과정 등에 관한 사항을 규정함을 목적으로 한다.",
      sortOrder: 1,
    },
  });

  const artGradV1_2 = await prisma.article.create({
    data: {
      revisionId: revGradV1.id,
      chapter: "제1장 총칙",
      section: null,
      articleNumber: 2,
      title: "교육목표",
      contentJson: [
        { type: "paragraph", num: "①", text: "본 대학원은 기예와 지성을 고루 함양하고 예술 분야 학술의 창작이론과 응용 방법을 심오하게 연구하여 고급 예술 전문 인력을 양성함을 기본 목표로 삼는다." }
      ],
      contentText: "본 대학원은 기예와 지성을 고루 함양하고 예술 분야 학술의 창작이론과 응용 방법을 심오하게 연구하여 고급 예술 전문 인력을 양성함을 기본 목표로 삼는다.",
      sortOrder: 2,
    },
  });

  // 6-2) 대학원 학칙 V2: 일부 개정 (2025-12-09) - 계약학과 및 특수대학원 다변화
  const revGradV2 = await prisma.revision.create({
    data: {
      ruleId: ruleGraduate.id,
      version: 2,
      versionName: "일부개정",
      revisionType: "AMENDMENT",
      enactmentDate: new Date("2025-12-09"),
      effectiveDate: new Date("2025-12-09"),
      announcementNumber: "제2-0-4호-개정",
      description: "문화예술/사회복지대학원 전문 창작 교수 편제 반영 및 산업체 위탁 계약학과 조항 신설 개정",
    },
  });

  const artGradV2_1 = await prisma.article.create({
    data: {
      revisionId: revGradV2.id,
      chapter: "제1장 총칙",
      section: null,
      articleNumber: 1,
      title: "목적",
      contentJson: [
        { type: "paragraph", num: "①", text: "이 학칙은 예원예술대학교(이하 \"이 대학교\"라 한다) 대학원의 교육목표를 설정하고 이를 달성하기 위한 학사운영, 교육과정 등에 관한 사항을 규정함을 목적으로 한다." }
      ],
      contentText: "이 학칙은 예원예술대학교(이하 \"이 대학교\"라 한다) 대학원의 교육목표를 설정하고 이를 달성하기 위한 학사운영, 교육과정 등에 관한 사항을 규정함을 목적으로 한다.",
      sortOrder: 1,
    },
  });

  const artGradV2_2 = await prisma.article.create({
    data: {
      revisionId: revGradV2.id,
      chapter: "제1장 총칙",
      section: null,
      articleNumber: 2,
      title: "대학원의 종류 및 교육목표",
      contentJson: [
        { type: "paragraph", num: "①", text: "이 대학교에 다음 각 호의 대학원을 둔다." },
        { type: "item", num: "1.", text: "일반대학원: 일반 전공 학술의 심도 깊은 이론과 기예 창작을 연구한다." },
        { type: "item", num: "2.", text: "문화예술대학원: 문화예술체육분야의 창작이론과 실기를 교수하여 고급 문화예술체육인력을 양성한다. (개정 2025.12.09)" },
        { type: "item", num: "3.", text: "사회복지대학원: 복지 실천 현장에 즉시 공헌하는 사회복지 인재를 교수 육성한다." },
        { type: "paragraph", num: "②", text: "각 대학원에는 학위를 수여하지 아니하는 연구과정과 공개강좌 및 전문가과정을 둘 수 있다. (신설 2025.12.09)" }
      ],
      contentText: "이 대학교에 다음 각 호의 대학원을 둔다. 1. 일반대학원: 일반 전공 학술의 심도 깊은 이론과 기예 창작을 연구한다. 2. 문화예술대학원: 문화예술체육분야의 창작이론과 실기를 교수하여 고급 문화예술체육인력을 양성한다. 3. 사회복지대학원: 복지 실천 현장에 즉시 공헌하는 사회복지 인재를 교수 육성한다. 각 대학원에는 학위를 수여하지 아니하는 연구과정과 공개강좌 및 전문가과정을 둘 수 있다.",
      sortOrder: 2,
    },
  });

  const artGradV2_3 = await prisma.article.create({
    data: {
      revisionId: revGradV2.id,
      chapter: "제1장 총칙",
      section: null,
      articleNumber: 3,
      title: "계약학과 등",
      contentJson: [
        { type: "paragraph", num: "①", text: "각 대학원에 국가, 지방자치단체 또는 산업체 등과의 계약에 의한 산업교육 위탁과정 또는 직업교육훈련과정 또는 전공과 산업교육특별과정 등(이하 “계약학과”등 이라한다.)을 둘 수 있다. (신설 2025.12.09)" }
      ],
      contentText: "각 대학원에 국가, 지방자치단체 또는 산업체 등과의 계약에 의한 산업교육 위탁과정 또는 직업교육훈련과정 또는 전공과 산업교육특별과정 등(이하 “계약학과”등 이라한다.)을 둘 수 있다.",
      sortOrder: 3,
    },
  });

  // 대비표 매핑 (대학원 학칙 V2 기준)
  await prisma.articleComparison.create({
    data: {
      revisionId: revGradV2.id,
      beforeArticleId: artGradV1_2.id,
      afterArticleId: artV2_2.id, // V1_2 ➡️ V2_2의 변화 대비
      note: "일반/문화예술/사회복지 대학원 다변화 명세 및 비학위 연구과정 조항 신설 반영",
    },
  });

  await prisma.articleComparison.create({
    data: {
      revisionId: revGradV2.id,
      beforeArticleId: null, // 신설이므로 null
      afterArticleId: artGradV2_3.id,
      note: "지방자치단체 및 산업체 협약 위탁 교육을 지원하기 위한 계약학과 제3조의2 조항 신설",
    },
  });

  // 첨부파일
  await prisma.attachment.create({
    data: {
      ruleId: ruleGraduate.id,
      title: "2-0-4 대학원 학칙 규정집(시행 2025.12.09).hwp",
      fileUrl: "/files/yewon_graduate_v2025.hwp",
      fileSize: 258560,
      fileType: "hwp",
    },
  });

  console.log("대학원 학칙 규정 생성 완료.");


  // 7. [실제 데이터] 교직원 복무 규정 (폐지 이력)
  const ruleStaff = await prisma.rule.create({
    data: {
      title: "교직원 복무 규정",
      ruleNumber: "제35호",
      initialSound: "ㄱ",
      status: "ABOLISHED",
      categoryId: catPersonnel.id,
      departmentId: deptAdmin.id,
    },
  });

  const revStaffV1 = await prisma.revision.create({
    data: {
      ruleId: ruleStaff.id,
      version: 1,
      versionName: "제정",
      revisionType: "ENACTMENT",
      enactmentDate: new Date("2024-03-01"),
      effectiveDate: new Date("2024-03-01"),
      announcementNumber: "제35호",
      description: "최초 예원예술대학교 교직원 근무 준칙 수립을 위한 규정",
    },
  });

  const revStaffV2 = await prisma.revision.create({
    data: {
      ruleId: ruleStaff.id,
      version: 2,
      versionName: "폐지",
      revisionType: "ABOLITION",
      enactmentDate: new Date("2026-01-01"),
      effectiveDate: new Date("2026-01-01"),
      announcementNumber: "제79호",
      description: "대학 통합 행정직원 직제 개편 및 규정집 일원화에 따른 폐지 및 '교직원 인사 일반 규정'으로의 통합 이관",
    },
  });

  await prisma.article.create({
    data: {
      revisionId: revStaffV1.id,
      chapter: "제1장 총칙",
      section: null,
      articleNumber: 1,
      title: "목적",
      contentJson: [
        { type: "paragraph", num: "①", text: "이 규정은 예원예술대학교에 근무하는 교직원의 성실한 직무 복무 기준과 태도를 확립함을 목적으로 한다." }
      ],
      contentText: "이 규정은 예원예술대학교에 근무하는 교직원의 성실한 직무 복무 기준과 태도를 확립함을 목적으로 한다.",
      sortOrder: 1,
    },
  });

  console.log("폐지 규정 생성 완료.");

  // 7-2) 초기 공지사항 데이터 생성
  console.log("초기 공지사항 데이터를 생성합니다...");
  await prisma.notice.createMany({
    data: [
      {
        title: "2026학년도 제1학기 대학평의원회 규정 심의 결과 안내",
        content: "2026학년도 제1학기 대학평의원회 회의에서 상정된 규정안(대학원 학칙 일부개정 및 학칙 일부개정)이 심의 의결되었음을 안내해 드립니다. 자세한 조항 내용은 현행규정 본문 및 입안편집기를 참고하여 주시기 바랍니다.",
        dept: "기획처",
        date: "2026.05.20",
      },
      {
        title: "[공고] 학칙 및 학사행정규정 일부 개정 안 예고 수렴",
        content: "학칙 일부개정 및 장학금 지급 규정 일부개정안에 대하여 대학 구성원들의 소중한 의견을 수렴하고자 하오니, 의견이 있으신 부서 및 개인은 기한 내에 의견서를 제출해 주시기 바랍니다.",
        dept: "교무처",
        date: "2026.05.14",
      },
      {
        title: "예원예술대학교 요람 및 규정집 편찬위원회 발족식 개최",
        content: "예원예술대학교 공식 규정집 전면 디지털화 및 편찬을 위한 위원회가 공식 발족하였습니다. 향후 모든 규정은 본 디지털 규정관리시스템을 통해 전자 관리 및 제개정이 이뤄질 예정입니다.",
        dept: "총무처",
        date: "2026.05.02",
      },
      {
        title: "정부 재정지원 제한 평가 대비 정관 개정 완료 공지",
        content: "대학 평가지표 충족 및 정관 조항 조화를 위한 일부 개정이 완료되어 공포되었음을 공지합니다.",
        dept: "기획처",
        date: "2026.04.28",
      },
      {
        title: "규정관리시스템 리뉴얼 오픈 안내",
        content: "예원예술대학교 내규규정 디지털 정비 사업의 일환으로 신규 규정관리시스템이 리뉴얼 오픈하였습니다. 입안편집기(DLMS)를 이용한 실시간 신구대비표 대조 작성이 가능하오니 많은 이용 바랍니다.",
        dept: "전산정보원",
        date: "2026.04.15",
      },
    ],
  });
  console.log("초기 공지사항 데이터 생성 완료.");

  console.log("모든 예원예술대학교 실제 규정 데이터의 시딩 준비가 완벽히 끝났습니다.");
}

main()
  .catch((e) => {
    console.error("Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
