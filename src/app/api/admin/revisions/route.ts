export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function POST(request: Request) {
  const pool = createPool();
  let client;
  try {
    client = await pool.connect();
    const body = await request.json();
    const { ruleId, versionName, revisionType, enactmentDate, effectiveDate, announcementNumber, description, articles } = body;

    if (!ruleId || !versionName || !revisionType || !enactmentDate || !effectiveDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await client.query("BEGIN");

    const prevRes = await client.query(
      `SELECT id, version FROM "Revision" WHERE "ruleId" = $1 ORDER BY version DESC LIMIT 1`,
      [ruleId]
    );
    const previousRevision = prevRes.rows[0] || null;
    const nextVersion = previousRevision ? previousRevision.version + 1 : 1;

    let oldArticles: any[] = [];
    if (previousRevision) {
      const oldArtRes = await client.query(
        `SELECT id, "articleNumber", "contentText" FROM "Article" WHERE "revisionId" = $1`,
        [previousRevision.id]
      );
      oldArticles = oldArtRes.rows;
    }

    const newRevisionId = crypto.randomUUID();
    await client.query(
      `INSERT INTO "Revision" (id, "ruleId", version, "versionName", "revisionType", "enactmentDate", "effectiveDate", "announcementNumber", description, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [newRevisionId, ruleId, nextVersion, versionName, revisionType, new Date(enactmentDate), new Date(effectiveDate), announcementNumber || "공포", description || `${versionName} 공포 반영`]
    );

    const createdNewArticles: any[] = [];
    if (Array.isArray(articles) && articles.length > 0) {
      for (const art of articles) {
        const artId = crypto.randomUUID();
        await client.query(
          `INSERT INTO "Article" (id, "revisionId", chapter, section, "articleNumber", title, "contentJson", "contentText", "sortOrder", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
          [artId, newRevisionId, art.chapter || null, art.section || null, parseInt(art.articleNumber) || 1, art.title || "제목없음", JSON.stringify(art.contentJson || {}), art.contentText || "", art.sortOrder || 1]
        );
        createdNewArticles.push({ id: artId, articleNumber: parseInt(art.articleNumber) || 1, contentText: art.contentText || "" });
      }
    }

    if (oldArticles.length > 0 && createdNewArticles.length > 0) {
      const allNums = Array.from(new Set([...oldArticles.map((a) => a.articleNumber), ...createdNewArticles.map((a) => a.articleNumber)])).sort((a, b) => a - b);
      for (const num of allNums) {
        const beforeArt = oldArticles.find((a) => a.articleNumber === num);
        const afterArt = createdNewArticles.find((a) => a.articleNumber === num);
        if (beforeArt && afterArt && beforeArt.contentText !== afterArt.contentText) {
          await client.query(`INSERT INTO "ArticleComparison" (id, "revisionId", "beforeArticleId", "afterArticleId", note, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`, [crypto.randomUUID(), newRevisionId, beforeArt.id, afterArt.id, "일부 개정"]);
        } else if (beforeArt && !afterArt) {
          await client.query(`INSERT INTO "ArticleComparison" (id, "revisionId", "beforeArticleId", "afterArticleId", note, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`, [crypto.randomUUID(), newRevisionId, beforeArt.id, null, "조항 삭제"]);
        } else if (!beforeArt && afterArt) {
          await client.query(`INSERT INTO "ArticleComparison" (id, "revisionId", "beforeArticleId", "afterArticleId", note, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`, [crypto.randomUUID(), newRevisionId, null, afterArt.id, "조항 신설"]);
        }
      }
    }

    await client.query("COMMIT");
    return NextResponse.json({ success: true, revisionId: newRevisionId, version: nextVersion });
  } catch (error: any) {
    if (client) {
      try { await client.query("ROLLBACK"); } catch (e) { console.error("Rollback error:", e); }
    }
    console.error("[Admin Revision POST Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 });
  } finally {
    if (client) {
      try { client.release(); } catch (e) { console.error("Release error:", e); }
    }
    try { if (pool) await pool.end(); } catch (e) { console.error("Pool end error:", e); }
  }
}
