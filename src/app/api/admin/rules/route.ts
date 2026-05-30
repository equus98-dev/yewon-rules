export const runtime = "edge";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 초성 추출 헬퍼 함수
function getInitialSound(text: string): string {
  if (!text) return "ㄱ";
  const cleanText = text.replace(/[^가-힣a-zA-Z0-9]/g, "");
  if (cleanText.length === 0) return "ㄱ";
  
  const char = cleanText.charAt(0);
  const code = char.charCodeAt(0) - 0xac00;
  
  if (code >= 0 && code < 11172) {
    const chosungList = [
      "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
      "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"
    ];
    return chosungList[Math.floor(code / 588)];
  }
  return char.toUpperCase();
}

// 1. 전체 규정 마스터 목록 조회
export async function GET() {
  try {
    const rules = await prisma.rule.findMany({
      include: {
        category: {
          select: { name: true },
        },
        department: {
          select: { name: true },
        },
        revisions: {
          orderBy: { version: "desc" },
          take: 1,
          select: {
            versionName: true,
            enactmentDate: true,
          },
        },
      },
      orderBy: { title: "asc" },
    });

    const mappedRules = rules.map((r) => ({
      id: r.id,
      title: r.title,
      ruleNumber: r.ruleNumber,
      initialSound: r.initialSound,
      status: r.status,
      categoryId: r.categoryId,
      categoryName: r.category?.name || "미분류",
      departmentId: r.departmentId,
      departmentName: r.department?.name || "미지정",
      latestVersion: r.revisions[0]?.versionName || "제정",
      enactmentDate: r.revisions[0]?.enactmentDate ? r.revisions[0].enactmentDate.toISOString().split("T")[0] : "-",
    }));

    return NextResponse.json(mappedRules);
  } catch (error: any) {
    console.error("[Admin Rules GET Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// 2. 신규 규정 제정 등록
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      ruleNumber,
      categoryId,
      departmentId,
      enactmentDate,
      announcementNumber,
      fileUrl,
      articles,
    } = body;

    if (!title || !ruleNumber || !categoryId || !departmentId || !enactmentDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const dateParsed = new Date(enactmentDate);

    // 1) Rule 및 하위 관계형 트랜잭션 동시 생성
    // Prisma 6 Edge 어댑터 환경에서는 트랜잭션을 일련의 순차 쿼리로 처리합니다.
    const rule = await prisma.rule.create({
      data: {
        title,
        ruleNumber,
        initialSound: getInitialSound(title),
        status: "EFFECTIVE",
        categoryId,
        departmentId,
      },
    });

    const revision = await prisma.revision.create({
      data: {
        ruleId: rule.id,
        version: 1,
        versionName: "제정",
        revisionType: "ENACTMENT",
        enactmentDate: dateParsed,
        effectiveDate: dateParsed,
        announcementNumber: announcementNumber || "최초공포",
        description: `${title} 최초 제정 공포 반영`,
      },
    });

    // 첨부파일 정보가 제공된 경우 Attachment 추가
    if (fileUrl && fileUrl.trim() !== "") {
      const fileType = fileUrl.split(".").pop()?.split("?")[0] || "hwp";
      await prisma.attachment.create({
        data: {
          ruleId: rule.id,
          title: `${title}.${fileType}`,
          fileUrl,
          fileType,
        },
      });
    }

    // 기본 조항 리스트가 제공된 경우 일괄 추가
    if (Array.isArray(articles) && articles.length > 0) {
      for (const art of articles) {
        await prisma.article.create({
          data: {
            revisionId: revision.id,
            chapter: art.chapter || null,
            section: art.section || null,
            articleNumber: parseInt(art.articleNumber) || 1,
            title: art.title || "제목없음",
            contentJson: art.contentJson || {},
            contentText: art.contentText || "",
            sortOrder: art.sortOrder || 1,
          },
        });
      }
    } else {
      // 기본 1개 더미 조항 자동 주입
      await prisma.article.create({
        data: {
          revisionId: revision.id,
          chapter: "제1장 총칙",
          articleNumber: 1,
          title: "목적",
          contentJson: { paragraphs: ["이 규정은 학교의 운영에 관한 목적을 규정함을 목적으로 한다."] },
          contentText: "제1조 (목적) 이 규정은 학교의 운영에 관한 목적을 규정함을 목적으로 한다.",
          sortOrder: 1,
        },
      });
    }

    return NextResponse.json({ success: true, ruleId: rule.id });
  } catch (error: any) {
    console.error("[Admin Rules POST Error]:", error);
    // 중복 방지 코드 대응
    if (error.code === "P2002") {
      return NextResponse.json({ error: "이미 존재하는 규정 번호입니다." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// 3. 규정 상태 수정 / 삭제(폐지)
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing rule ID" }, { status: 400 });
    }

    const body = await request.json();
    const { status, title, categoryId, departmentId } = body;

    const rule = await prisma.rule.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(title && { title, initialSound: getInitialSound(title) }),
        ...(categoryId && { categoryId }),
        ...(departmentId && { departmentId }),
      },
    });

    return NextResponse.json({ success: true, rule });
  } catch (error: any) {
    console.error("[Admin Rules PUT Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
