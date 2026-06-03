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
      // 2. 과거 내용을 보존하기 위해 ArticleComparison 테이블의 note 필드 활용
      await pool.query(
        `INSERT INTO "ArticleComparison" (id, "revisionId", "beforeArticleId", "afterArticleId", note, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [crypto.randomUUID(), oldArt.revisionId, null, id, `[단순오타수정전본문]${oldArt.contentText}`]
      );
    }

    // 3. 본래 조항(Article) 덮어쓰기 업데이트
    await pool.query(
      `UPDATE "Article" SET "contentText" = $1, "contentJson" = $2, "updatedAt" = NOW() WHERE id = $3`,
      [contentText, cJsonStr, id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Admin Article API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  } finally {
    await pool.end();
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const pool = createPool();
  try {
    const { id } = await params;
    
    // 단순오타수정 연혁 조회 (note 필드에 저장된 텍스트 파싱)
    const historyRes = await pool.query(
      `SELECT id, "createdAt", note
       FROM "ArticleComparison"
       WHERE "afterArticleId" = $1 AND note LIKE '[단순오타수정전본문]%'
       ORDER BY "createdAt" DESC`,
      [id]
    );

    const history = historyRes.rows.map(row => ({
      id: row.id,
      createdAt: row.createdAt,
      beforeText: row.note.replace('[단순오타수정전본문]', '')
    }));

    return NextResponse.json({ history });
  } catch (error: any) {
    console.error("[Admin Article History API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  } finally {
    await pool.end();
  }
}
