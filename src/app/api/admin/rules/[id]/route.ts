export const runtime = "edge";
import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const pool = createPool();
  try {
    const { id } = params;
    const body = await request.json();
    const { contentHtml, revisionId } = body;

    if (!contentHtml || !revisionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const res = await pool.query(
      `SELECT id FROM "Article" WHERE "revisionId" = $1 ORDER BY "sortOrder" ASC`,
      [revisionId]
    );
    const articles = res.rows;

    if (articles.length === 0) {
      return NextResponse.json({ error: "No articles found for this revision" }, { status: 404 });
    }

    const firstArticle = articles[0];

    await pool.query('BEGIN');
    
    await pool.query(
      `UPDATE "Article" SET "contentHtml" = $1 WHERE id = $2`,
      [contentHtml, firstArticle.id]
    );

    for (let i = 1; i < articles.length; i++) {
      await pool.query(
        `UPDATE "Article" SET "contentHtml" = $1 WHERE id = $2`,
        [" ", articles[i].id]
      );
    }
    
    await pool.query('COMMIT');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    await pool.query('ROLLBACK');
    console.error("[Admin Rule API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  } finally {
    await pool.end();
  }
}
