// export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      ruleId,
      versionName,
      revisionType,
      enactmentDate,
      effectiveDate,
      announcementNumber,
      description,
      articles, // Array of newly drafted articles
    } = body;

    if (!ruleId || !versionName || !revisionType || !enactmentDate || !effectiveDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. 해당 규정의 기존 최신 버전(이전 버전) 찾기
    const previousRevisions = await prisma.revision.findMany({
      where: { ruleId },
      orderBy: { version: "desc" },
      take: 1,
      include: {
        articles: true,
      },
    });

    const previousRevision = previousRevisions[0];
    const nextVersion = previousRevision ? previousRevision.version + 1 : 1;

    const dateEnactment = new Date(enactmentDate);
    const dateEffective = new Date(effectiveDate);

    // 2. 신규 Revision 레코드 생성
    const newRevision = await prisma.revision.create({
      data: {
        ruleId,
        version: nextVersion,
        versionName,
        revisionType,
        enactmentDate: dateEnactment,
        effectiveDate: dateEffective,
        announcementNumber: announcementNumber || "공포",
        description: description || `${versionName} 공포 반영`,
      },
    });

    // 3. 신규 조항들(Articles) 데이터베이스에 저장
    const createdNewArticles: any[] = [];
    if (Array.isArray(articles) && articles.length > 0) {
      for (const art of articles) {
        const savedArt = await prisma.article.create({
          data: {
            revisionId: newRevision.id,
            chapter: art.chapter || null,
            section: art.section || null,
            articleNumber: parseInt(art.articleNumber) || 1,
            title: art.title || "제목없음",
            contentJson: art.contentJson || {},
            contentText: art.contentText || "",
            sortOrder: art.sortOrder || 1,
          },
        });
        createdNewArticles.push(savedArt);
      }
    }

    // 4. 자동 신구조문대비표(ArticleComparison) 매핑 및 생성
    if (previousRevision && createdNewArticles.length > 0) {
      const oldArticles = previousRevision.articles;
      
      // 개정 전/후 조항 번호 기준으로 매칭하여 차이 비교 분석
      const allArticleNumbers = Array.from(
        new Set([
          ...oldArticles.map((a) => a.articleNumber),
          ...createdNewArticles.map((a) => a.articleNumber),
        ])
      ).sort((a, b) => a - b);

      for (const num of allArticleNumbers) {
        const beforeArt = oldArticles.find((a) => a.articleNumber === num);
        const afterArt = createdNewArticles.find((a) => a.articleNumber === num);

        if (beforeArt && afterArt) {
          // 둘 다 존재하는데 내용이 다른 경우 -> <개정> 생성
          if (beforeArt.contentText !== afterArt.contentText) {
            await prisma.articleComparison.create({
              data: {
                revisionId: newRevision.id,
                beforeArticleId: beforeArt.id,
                afterArticleId: afterArt.id,
                note: "일부 개정",
              },
            });
          }
        } else if (beforeArt && !afterArt) {
          // 개정 전에만 존재했던 경우 -> <삭제> 생성
          await prisma.articleComparison.create({
            data: {
              revisionId: newRevision.id,
              beforeArticleId: beforeArt.id,
              afterArticleId: null,
              note: "조항 삭제",
            },
          });
        } else if (!beforeArt && afterArt) {
          // 개정 후에 새로 생긴 경우 -> <신설> 생성
          await prisma.articleComparison.create({
            data: {
              revisionId: newRevision.id,
              beforeArticleId: null,
              afterArticleId: afterArt.id,
              note: "조항 신설",
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true, revisionId: newRevision.id, version: nextVersion });
  } catch (error: any) {
    console.error("[Admin Revision POST Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
