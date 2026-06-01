// export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";



export async function POST(request: Request) {
  
  const client = await pool.connect();
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
      articles,
    } = body;

    if (!ruleId || !versionName || !revisionType || !enactmentDate || !effectiveDate) {
      client.release();
      
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await client.query("BEGIN");

    // 1. 이전 최신 버전 조회
    const prevRes = await client.query(
      `SELECT id, version FROM "Revision" WHERE "ruleId" = $1 ORDER BY version DESC LIMIT 1`,
      [ruleId]
    );
    const previousRevision = prevRes.rows[0] || null;
    const nextVersion = previousRevision ? previousRevision.version + 1 : 1;

    // 이전 버전의 조항 조회 (신구조문대비표용)
    let oldArticles: any[] = [];
    if (previousRevision) {
      const oldArtRes = await client.query(
        `SELECT id, "articleNumber", "contentText" FROM "Article" WHERE "revisionId" = $1`,
        [previousRevision.id]
      );
      oldArticles = oldArtRes.rows;
    }

    // 2. 신규 Revision 생성
    const newRevisionId = crypto.randomUUID();
    await client.query(
      `INSERT INTO "Revision" (id, "ruleId", version, "versionName", "revisionType", "enactmentDate", "effectiveDate", "announcementNumber", description, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [
        newRevisionId,
        ruleId,
        nextVersion,
        versionName,
        revisionType,
        new Date(enactmentDate),
        new Date(effectiveDate),
        announcementNumber || "공포",
        description || `${versionName} 공포 반영`,
      ]
    );

    // 3. 신규 조항 저장
    const createdNewArticles: any[] = [];
    if (Array.isArray(articles) && articles.length > 0) {
      for (const art of articles) {
        const artId = crypto.randomUUID();
        await client.query(
          `INSERT INTO "Article" (id, "revisionId", chapter, section, "articleNumber", title, "contentJson", "contentText", "sortOrder", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
          [
            artId,
            newRevisionId,
            art.chapter || null,
            art.section || null,
            parseInt(art.articleNumber) || 1,
            art.title || "제목없음",
            JSON.stringify(art.contentJson || {}),
            art.contentText || "",
            art.sortOrder || 1,
          ]
        );
        createdNewArticles.push({ id: artId, articleNumber: parseInt(art.articleNumber) || 1, contentText: art.contentText || "" });
      }
    }

    // 4. 신구조문대비표(ArticleComparison) 자동 생성
    if (oldArticles.length > 0 && createdNewArticles.length > 0) {
      const allNums = Array.from(
        new Set([
          ...oldArticles.map((a) => a.articleNumber),
          ...createdNewArticles.map((a) => a.articleNumber),
        ])
      ).sort((a, b) => a - b);

      for (const num of allNums) {
        const beforeArt = oldArticles.find((a) => a.articleNumber === num);
        const afterArt = createdNewArticles.find((a) => a.articleNumber === num);

        if (beforeArt && afterArt) {
          if (beforeArt.contentText !== afterArt.contentText) {
            await client.query(
              `INSERT INTO "ArticleComparison" (id, "revisionId", "beforeArticleId", "afterArticleId", note, "createdAt", "updatedAt")
               VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
              [crypto.randomUUID(), newRevisionId, beforeArt.id, afterArt.id, "일부 개정"]
            );
          }
        } else if (beforeArt && !afterArt) {
          await client.query(
            `INSERT INTO "ArticleComparison" (id, "revisionId", "beforeArticleId", "afterArticleId", note, "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
            [crypto.randomUUID(), newRevisionId, beforeArt.id, null, "조항 삭제"]
          );
        } else if (!beforeArt && afterArt) {
          await client.query(
            `INSERT INTO "ArticleComparison" (id, "revisionId", "beforeArticleId", "afterArticleId", note, "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
            [crypto.randomUUID(), newRevisionId, null, afterArt.id, "조항 신설"]
          );
        }
      }
    }

    await client.query("COMMIT");
    client.release();
    

    return NextResponse.json({ success: true, revisionId: newRevisionId, version: nextVersion });
  } catch (error: any) {
    await client.query("ROLLBACK");
    client.release();
    
    console.error("[Admin Revision POST Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
