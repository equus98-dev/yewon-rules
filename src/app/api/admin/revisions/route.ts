export const runtime = "edge";

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

function getInitialSound(text: string): string {
  if (!text) return "ㄱ";
  const cleanText = text.replace(/[^가-힣a-zA-Z0-9]/g, "");
  if (cleanText.length === 0) return "ㄱ";
  const char = cleanText.charAt(0);
  const code = char.charCodeAt(0) - 0xac00;
  if (code >= 0 && code < 11172) {
    const chosungList = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
    return chosungList[Math.floor(code / 588)];
  }
  return char.toUpperCase();
}

export async function POST(request: Request) {
  const pool = createPool();
  let client;
  try {
    client = await pool.connect();
    const body = (await request.json()) as any;
    const { ruleId, ruleTitle, versionName, revisionType, enactmentDate, effectiveDate, announcementNumber, description, articles } = body;

    if (!ruleId || !versionName || !revisionType || !enactmentDate || !effectiveDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await client.query("BEGIN");

    if (ruleTitle && ruleTitle.trim() !== "") {
      const newInitialSound = getInitialSound(ruleTitle.trim());
      await client.query(
        `UPDATE "Rule" SET title = $1, "initialSound" = $2, "updatedAt" = NOW() WHERE id = $3`,
        [ruleTitle.trim(), newInitialSound, ruleId]
      );
    }

    const prevRes = await client.query(
      `SELECT id, version FROM "Revision" WHERE "ruleId" = $1 ORDER BY version DESC LIMIT 1`,
      [ruleId]
    );
    const previousRevision = prevRes.rows[0] || null;
    const nextVersion = previousRevision ? previousRevision.version + 1 : 1;

    // 조문 복사(Deep Copy)를 위한 소스로는 조문(Article)이 존재하는 판본 중 가장 최신 판본을 선택 (조문이 비어있는 비정상 판본 방단)
    const prevValidRes = await client.query(
      `SELECT r.id, r.version 
       FROM "Revision" r
       WHERE r."ruleId" = $1 AND EXISTS (SELECT 1 FROM "Article" a WHERE a."revisionId" = r.id)
       ORDER BY r.version DESC LIMIT 1`,
      [ruleId]
    );
    const validSourceRevision = prevValidRes.rows[0] || previousRevision;

    let oldArticles: any[] = [];
    if (validSourceRevision) {
      const oldArtRes = await client.query(
        `SELECT id, "articleNumber", "contentText", part, chapter, section, "subSection" FROM "Article" WHERE "revisionId" = $1`,
        [validSourceRevision.id]
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
          `INSERT INTO "Article" (id, "revisionId", part, chapter, section, "subSection", "articleNumber", title, "contentJson", "contentText", "sortOrder", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
          [artId, newRevisionId, art.part || null, art.chapter || null, art.section || null, art.subSection || null, parseInt(art.articleNumber) || 1, art.title || "제목없음", JSON.stringify(art.contentJson || {}), art.contentText || "", art.sortOrder || 1]
        );
        createdNewArticles.push({ id: artId, articleNumber: parseInt(art.articleNumber) || 1, contentText: art.contentText || "", part: art.part || null, chapter: art.chapter || null, section: art.section || null, subSection: art.subSection || null });
      }
    } else if (validSourceRevision) {
      // 사용자 제안 반영: 입안/연혁 추가 시 명시적 조문 목록이 주어지지 않은 경우, 직전 유효 연혁의 모든 조문(Article)을 고스란히 복제(Deep Copy)하여 새 연혁에 적재
      await client.query(
        `INSERT INTO "Article" (id, "revisionId", part, chapter, section, "subSection", "articleNumber", title, "contentJson", "contentText", "sortOrder", "createdAt", "updatedAt")
         SELECT gen_random_uuid(), $1, part, chapter, section, "subSection", "articleNumber", title, "contentJson", "contentText", "sortOrder", NOW(), NOW()
         FROM "Article" 
         WHERE "revisionId" = $2`,
        [newRevisionId, validSourceRevision.id]
      );
    }

    if (oldArticles.length > 0 && createdNewArticles.length > 0) {
      const allNums = Array.from(new Set([...oldArticles.map((a) => a.articleNumber), ...createdNewArticles.map((a) => a.articleNumber)])).sort((a, b) => a - b);
      for (const num of allNums) {
        const beforeArt = oldArticles.find((a) => a.articleNumber === num);
        const afterArt = createdNewArticles.find((a) => a.articleNumber === num);
        if (beforeArt && afterArt && (beforeArt.contentText !== afterArt.contentText || beforeArt.part !== afterArt.part || beforeArt.chapter !== afterArt.chapter || beforeArt.section !== afterArt.section || beforeArt.subSection !== afterArt.subSection)) {
          let note = "일부 개정";
          if (beforeArt.part !== afterArt.part || beforeArt.chapter !== afterArt.chapter || beforeArt.section !== afterArt.section || beforeArt.subSection !== afterArt.subSection) {
            note = "일부 개정 (편/장/절/관 변경 포함)";
          }
          await client.query(`INSERT INTO "ArticleComparison" (id, "revisionId", "beforeArticleId", "afterArticleId", note, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`, [crypto.randomUUID(), newRevisionId, beforeArt.id, afterArt.id, note]);
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
