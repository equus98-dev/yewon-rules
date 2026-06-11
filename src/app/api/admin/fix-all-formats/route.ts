export const runtime = "edge";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

const escapeRegex = (s: string) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\s+/g, '\\s*');

export async function POST(request: Request) {
  let pool;
  try {
    pool = createPool();
    
    // 1. 모든 최신 Revision 의 Article 들을 가져오기
    const res = await pool.query(`
      WITH RankedRevisions AS (
        SELECT id, "ruleId", version,
               ROW_NUMBER() OVER(PARTITION BY "ruleId" ORDER BY version DESC) as rn
        FROM "Revision"
      )
      SELECT a.* 
      FROM "Article" a
      JOIN RankedRevisions r ON a."revisionId" = r.id AND r.rn = 1
      ORDER BY r."ruleId", a."sortOrder" ASC
    `);
    
    const allArticles = res.rows;
    if (allArticles.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: "No articles to update." });
    }

    // ruleId 단위로 Article 들 그룹핑
    const rulesMap = new Map<string, any[]>();
    for (const art of allArticles) {
       // Since the query joins on revision, we don't have ruleId explicitly in Article, but we can group by revisionId
       const revId = art.revisionId;
       if (!rulesMap.has(revId)) {
           rulesMap.set(revId, []);
       }
       rulesMap.get(revId)!.push(art);
    }

    let updatedCount = 0;

    await pool.query('BEGIN');

    // 2. 각 규정별로 순회하며 정화 진행
    for (const [revId, articles] of rulesMap.entries()) {
        // sort by sortOrder
        articles.sort((a, b) => a.sortOrder - b.sortOrder);

        for (let idx = 0; idx < articles.length; idx++) {
            const art = articles[idx];
            let cleanText = art.contentText || "";

            const nextArt = articles[idx + 1];
            if (nextArt) {
               if (nextArt.chapter && nextArt.chapter !== art.chapter && nextArt.section && nextArt.section !== art.section) {
                  const chapSecRegex = new RegExp(`\\n*\\s*${escapeRegex(nextArt.chapter)}\\s*\\n*\\s*${escapeRegex(nextArt.section)}\\s*$`);
                  cleanText = cleanText.replace(chapSecRegex, '');
               }
               if (nextArt.chapter && nextArt.chapter !== art.chapter) {
                  const chapRegex = new RegExp(`\\n*\\s*${escapeRegex(nextArt.chapter)}\\s*$`);
                  cleanText = cleanText.replace(chapRegex, '');
               }
               if (nextArt.section && nextArt.section !== art.section) {
                  const secRegex = new RegExp(`\\n*\\s*${escapeRegex(nextArt.section)}\\s*$`);
                  cleanText = cleanText.replace(secRegex, '');
               }
            }

            cleanText = cleanText.trim();

            if (cleanText !== art.contentText) {
                // If it was changed, update contentText and generate new contentJson
                let finalContentJson;
                if (art.contentJson) {
                    finalContentJson = typeof art.contentJson === 'string' ? JSON.parse(art.contentJson) : art.contentJson;
                    // If paragraphs exist, just replace the first paragraph as a fallback or leave it?
                    // Actually, the editor regenerates it completely if there are formatting errors!
                    // Let's just regenerate it exactly like the editor does:
                    finalContentJson = { paragraphs: [cleanText.split(") ").slice(1).join(") ") || cleanText] };
                } else {
                    finalContentJson = { paragraphs: [cleanText.split(") ").slice(1).join(") ") || cleanText] };
                }

                await pool.query(
                   `UPDATE "Article" SET "contentText" = $1, "contentJson" = $2 WHERE id = $3`,
                   [cleanText, JSON.stringify(finalContentJson), art.id]
                );
                updatedCount++;
            }
        }
    }

    await pool.query('COMMIT');

    return NextResponse.json({ success: true, count: updatedCount });
  } catch (error: any) {
    if (pool) await pool.query('ROLLBACK');
    console.error("[Fix All Formats API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  } finally {
    if (pool) await pool.end();
  }
}
