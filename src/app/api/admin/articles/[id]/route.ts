// export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const pool = createPool();
  try {
    const { id } = await params;
    const body = await request.json();
    const { contentText, contentJson } = body;

    if (!contentText) {
      return NextResponse.json({ error: "Missing required field: contentText" }, { status: 400 });
    }

    const cJsonStr = contentJson ? JSON.stringify(contentJson) : "{}";
    
    // 1. 현재 조항 내용 조회 (수정 전)
    const oldArtRes = await pool.query(
      `SELECT * FROM "Article" WHERE id = $1`,
      [id]
    );
    const oldArt = oldArtRes.rows[0];

    if (oldArt) {
      // 2. 과거 내용을 보존하기 위해 더미 revisionId로 복제본 생성
      const clonedId = crypto.randomUUID();
      const dummyRevisionId = "00000000-0000-0000-0000-000000000000"; // 화면에 노출되지 않도록 더미 UUID 사용
      await pool.query(
        `INSERT INTO "Article" (id, "revisionId", chapter, section, "articleNumber", title, "contentJson", "contentText", "contentHtml", "sortOrder", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [clonedId, dummyRevisionId, oldArt.chapter, oldArt.section, oldArt.articleNumber, oldArt.title, oldArt.contentJson, oldArt.contentText, oldArt.contentHtml, oldArt.sortOrder]
      );

      // 3. ArticleComparison에 단순오타수정 연혁 기록
      await pool.query(
        `INSERT INTO "ArticleComparison" (id, "revisionId", "beforeArticleId", "afterArticleId", note, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [crypto.randomUUID(), oldArt.revisionId, clonedId, id, "단순오타수정"]
      );
    }

    // 4. 본래 조항(Article) 덮어쓰기 업데이트
    await pool.query(
      `UPDATE "Article" SET "contentText" = $1, "contentJson" = $2, "updatedAt" = NOW() WHERE id = $3`,
      [contentText, cJsonStr, id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Admin Article API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const pool = createPool();
  try {
    const { id } = await params;
    
    // 단순오타수정 연혁 (과거 복제본) 목록 조회
    const historyRes = await pool.query(
      `SELECT c.id, c."createdAt", ba."contentText" as "beforeText"
       FROM "ArticleComparison" c
       JOIN "Article" ba ON c."beforeArticleId" = ba.id
       WHERE c."afterArticleId" = $1 AND c.note = '단순오타수정'
       ORDER BY c."createdAt" DESC`,
      [id]
    );

    return NextResponse.json({ history: historyRes.rows });
  } catch (error: any) {
    console.error("[Admin Article History API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
