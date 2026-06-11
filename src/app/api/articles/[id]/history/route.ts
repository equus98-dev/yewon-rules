import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let pool;
  try {
    pool = createPool();
    const { id } = await params;

    const historyRes = await pool.query(
      `WITH RECURSIVE HistoryCTE AS (
         -- 기저 조건: 주어진 articleId가 afterArticleId인 경우
         SELECT 
           ac."beforeArticleId", 
           ac."afterArticleId",
           ac.note,
           1 as depth
         FROM "ArticleComparison" ac
         WHERE ac."afterArticleId" = $1 AND ac.note NOT LIKE '[단순오타수정전본문]%'
         
         UNION ALL
         
         -- 재귀 조건: 현재의 beforeArticleId가 다음 단계의 afterArticleId가 됨
         SELECT 
           ac."beforeArticleId", 
           ac."afterArticleId",
           ac.note,
           h.depth + 1
         FROM "ArticleComparison" ac
         JOIN HistoryCTE h ON ac."afterArticleId" = h."beforeArticleId"
         WHERE ac.note NOT LIKE '[단순오타수정전본문]%'
       )
       SELECT 
         h.depth,
         h.note,
         beforeArt.part as "beforePart",
         beforeArt.chapter as "beforeChapter",
         beforeArt.section as "beforeSection",
         beforeArt."subSection" as "beforeSubSection",
         beforeArt."contentText" as "beforeText",
         afterArt.part as "afterPart",
         afterArt.chapter as "afterChapter",
         afterArt.section as "afterSection",
         afterArt."subSection" as "afterSubSection",
         afterArt."contentText" as "afterText",
         r1."versionName" as "beforeVersion",
         r1."enactmentDate" as "beforeDate",
         r2."versionName" as "afterVersion",
         r2."enactmentDate" as "afterDate"
       FROM HistoryCTE h
       LEFT JOIN "Article" beforeArt ON h."beforeArticleId" = beforeArt.id
       JOIN "Article" afterArt ON h."afterArticleId" = afterArt.id
       LEFT JOIN "Revision" r1 ON beforeArt."revisionId" = r1.id
       JOIN "Revision" r2 ON afterArt."revisionId" = r2.id
       ORDER BY h.depth ASC`,
      [id]
    );

    return NextResponse.json({ history: historyRes.rows });
  } catch (error: any) {
    console.error("[Article History API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  } finally {
    if (pool) await pool.end();
  }
}
