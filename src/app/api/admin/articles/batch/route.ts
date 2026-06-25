export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function POST(request: Request) {
  let pool;
  try {
    const body = await request.json() as { revisionId?: string; articles?: any[] };
    const { revisionId, articles } = body;

    if (!revisionId || !articles || !Array.isArray(articles)) {
      return NextResponse.json({ error: "revisionId and articles array required" }, { status: 400 });
    }

    pool = createPool();

    for (const art of articles) {
      const id = crypto.randomUUID();
      await pool.query(
        `INSERT INTO "Article" (id, "revisionId", chapter, section, "articleNumber", title, "contentJson", "contentText", "sortOrder", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
        [id, revisionId, art.chapter || null, art.section || null, art.articleNumber, art.title, art.contentJson, art.contentText, art.sortOrder]
      );
    }

    return NextResponse.json({ success: true, message: `${articles.length}개의 조문이 추가되었습니다.` });
  } catch (error: any) {
    console.error("[Add Articles Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  } finally {
    if (pool) await pool.end();
  }
}
