// export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrisma();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const versionParam = searchParams.get("version");

    // 1. 규정 기본 마스터와 연혁 리스트, 첨부 서식 조회
    const rule = await prisma.rule.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true },
        },
        department: {
          select: { id: true, name: true },
        },
        attachments: {
          orderBy: { createdAt: "asc" },
        },
        revisions: {
          select: {
            id: true,
            version: true,
            versionName: true,
            revisionType: true,
            enactmentDate: true,
            effectiveDate: true,
            announcementNumber: true,
            description: true,
          },
          orderBy: { version: "desc" }, // 최신 버전이 가장 먼저 오도록
        },
      },
    });

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    if (rule.revisions.length === 0) {
      return NextResponse.json({
        ...rule,
        currentRevision: null,
      });
    }

    // 2. 조회할 버전 설정 (지정된 경우 해당 버전, 없으면 가장 최신 버전)
    let targetRevisionId = "";
    if (versionParam) {
      const versionNum = parseInt(versionParam, 10);
      const matchedRev = rule.revisions.find((r) => r.version === versionNum);
      if (matchedRev) {
        targetRevisionId = matchedRev.id;
      }
    }

    // 지정된 버전을 못 찾았거나 안 들어온 경우 최신 버전 채택
    if (!targetRevisionId) {
      targetRevisionId = rule.revisions[0].id;
    }

    // 3. 현재 선택된 버전의 상세 데이터(조항 목록 + 신구조문대비표) 로드
    const currentRevision = await prisma.revision.findUnique({
      where: { id: targetRevisionId },
      include: {
        articles: {
          orderBy: { sortOrder: "asc" },
        },
        comparisons: {
          include: {
            beforeArticle: {
              select: {
                chapter: true,
                articleNumber: true,
                title: true,
                contentText: true,
                contentJson: true,
              },
            },
            afterArticle: {
              select: {
                chapter: true,
                articleNumber: true,
                title: true,
                contentText: true,
                contentJson: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      ...rule,
      currentRevision,
    });
  } catch (error: any) {
    console.error("[Rule API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
