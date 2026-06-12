import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const execute = searchParams.get("execute") === "true";
  let pool;
  
  try {
    pool = createPool();
    
    // Get all rules and their current revision
    const rulesRes = await pool.query(`SELECT r.id as "ruleId", r.name, rev.id as "revisionId" FROM "Rule" r JOIN "Revision" rev ON r."currentRevisionId" = rev.id`);
    
    const logs: any[] = [];
    
    for (const rule of rulesRes.rows) {
      // Get all addendum articles for this revision
      const artsRes = await pool.query(`SELECT id, "articleNumber", "contentText", "contentJson" FROM "Article" WHERE "revisionId" = $1 AND "articleNumber" >= 8000 AND "articleNumber" < 9000 ORDER BY "articleNumber" ASC`, [rule.revisionId]);
      
      const articles = artsRes.rows;
      if (articles.length === 0) continue;
      
      let currentAddendum: any = null;
      let toUpdate: any[] = [];
      let toDelete: any[] = [];
      
      for (const art of articles) {
        const text = String(art.contentText || "").trim();
        const isAddendumHeader = /^부\s*칙/.test(text);
        
        if (isAddendumHeader) {
          if (currentAddendum) {
            toUpdate.push(currentAddendum);
          }
          currentAddendum = {
            id: art.id,
            articleNumber: art.articleNumber,
            mergedText: text
          };
        } else if (currentAddendum && /^제\d+조/.test(text)) {
          // This article is actually a part of the previous addendum
          currentAddendum.mergedText += "\n" + text;
          toDelete.push(art.id);
        } else if (!currentAddendum) {
          // It's a stray article, maybe just ignore or treat as header?
          currentAddendum = {
            id: art.id,
            articleNumber: art.articleNumber,
            mergedText: text
          };
        } else {
           // Other text, append just in case
           currentAddendum.mergedText += "\n" + text;
           toDelete.push(art.id);
        }
      }
      
      if (currentAddendum) {
        toUpdate.push(currentAddendum);
      }
      
      if (toDelete.length > 0) {
        logs.push({
          ruleName: rule.name,
          updates: toUpdate,
          deletes: toDelete
        });
        
        if (execute) {
          // Perform updates
          for (const upd of toUpdate) {
            const paragraphs = upd.mergedText.split("\n").filter(l => l.trim().length > 0);
            const contentJson = paragraphs.map(p => {
              if (/^제\d+조/.test(p.trim())) return { type: "paragraph", text: p.trim() };
              return { type: "article", text: p.trim() };
            });
            const cJsonStr = JSON.stringify(contentJson);
            
            await pool.query(`UPDATE "Article" SET "contentText" = $1, "contentJson" = $2, "title" = '부칙', "chapter" = '부칙' WHERE id = $3`, [upd.mergedText, cJsonStr, upd.id]);
          }
          // Perform deletes
          for (const delId of toDelete) {
            await pool.query(`DELETE FROM "Article" WHERE id = $1`, [delId]);
          }
        }
      }
    }
    
    return NextResponse.json({ success: true, logs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (pool) await pool.end();
  }
}
