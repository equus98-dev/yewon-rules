import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let pool;
  try {
    const headerSecret = request.headers.get("x-sync-secret");
    if (headerSecret !== "yewon-secret-token-2026") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as any;
    const articles = body.articles;

    if (!Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json({ error: "Invalid articles array" }, { status: 400 });
    }

    pool = createPool();
    console.log(`Syncing ${articles.length} articles to D1...`);

    let successCount = 0;
    let failCount = 0;

    for (const a of articles) {
      try {
        const query = `
          INSERT OR IGNORE INTO Article (
            id, revisionId, chapter, section, articleNumber, title, 
            contentJson, contentHtml, contentText, sortOrder, part, subSection
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `;
        
        const params = [
          a.id,
          a.revisionId,
          a.chapter || null,
          a.section || null,
          a.articleNumber,
          a.title || "",
          typeof a.contentJson === "object" ? JSON.stringify(a.contentJson) : String(a.contentJson || "[]"),
          a.contentHtml || null,
          a.contentText || "",
          a.sortOrder || 1,
          a.part || null,
          a.subSection || null
        ];

        await pool.query(query, params);
        successCount++;
      } catch (err: any) {
        failCount++;
        console.error(`Failed to insert article ${a.id} in Edge runtime:`, err.message);
      }
    }

    return NextResponse.json({ success: true, successCount, failCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}
