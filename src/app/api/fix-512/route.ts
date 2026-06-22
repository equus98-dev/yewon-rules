import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const db = process.env.DB as any;
    
    // Get rule 5-1-2
    const ruleRes = await db.prepare(`SELECT id FROM Rule WHERE ruleNumber = '5-1-2'`).first();
    if (!ruleRes) return NextResponse.json({ error: "Rule 5-1-2 not found" });

    const revRes = await db.prepare(`SELECT id FROM Revision WHERE ruleId = ? ORDER BY version DESC LIMIT 1`).bind(ruleRes.id).first();
    if (!revRes) return NextResponse.json({ error: "Revision not found" });

    const articles = await db.prepare(`SELECT id, contentText, contentJson FROM Article WHERE revisionId = ?`).bind(revRes.id).all();

    let updatedCount = 0;

    for (const article of articles.results) {
      let changed = false;
      let textStr = article.contentText || "";
      let jsonStr = article.contentJson || "";

      // Fix random enters and red colors
      const replacements = [
        { from: /제\n고하고자/g, to: '제고하고자' },
        { from: /제\\n고하고자/g, to: '제고하고자' },
        // Remove style attributes containing red color or just the color property
        { from: /color:\s*(?:#ff0000|red);?/gi, to: '' },
        { from: /color="#ff0000"/gi, to: '' },
        { from: /color="red"/gi, to: '' }
      ];

      for (const r of replacements) {
        if (textStr.match(r.from)) {
          textStr = textStr.replace(r.from, r.to);
          changed = true;
        }
        if (jsonStr.match(r.from)) {
          jsonStr = jsonStr.replace(r.from, r.to);
          changed = true;
        }
      }

      if (changed) {
        await db.prepare(`UPDATE Article SET contentText = ?, contentJson = ? WHERE id = ?`).bind(textStr, jsonStr, article.id).run();
        updatedCount++;
      }
    }

    return NextResponse.json({ success: true, message: `Updated ${updatedCount} articles!` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
