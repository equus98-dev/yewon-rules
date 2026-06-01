import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { contentHtml, revisionId } = body;

    if (!contentHtml || !revisionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 수정 대상 Revision에 포함된 Article들을 가져옵니다.
    const articles = await prisma.article.findMany({
      where: { revisionId: revisionId },
      orderBy: { sortOrder: 'asc' },
    });

    if (articles.length === 0) {
      return NextResponse.json({ error: "No articles found for this revision" }, { status: 404 });
    }

    // 첫 번째 Article에 HTML 콘텐츠를 통째로 저장하고, 나머지는 빈 HTML로 처리하여
    // 렌더링 시 중복되지 않도록 합니다.
    const firstArticle = articles[0];

    await prisma.$transaction([
      prisma.article.update({
        where: { id: firstArticle.id },
        data: { contentHtml: contentHtml },
      }),
      ...articles.slice(1).map((article) =>
        prisma.article.update({
          where: { id: article.id },
          data: { contentHtml: " " }, // 공백으로 채워 렌더링 시 무시되도록 함
        })
      ),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Admin Rule API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
