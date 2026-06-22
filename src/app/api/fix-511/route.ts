import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const db = process.env.DB as any;
    
    // Get all articles for rule 5-1-1
    const ruleRes = await db.prepare(`SELECT id FROM Rule WHERE ruleNumber = '5-1-1'`).first();
    if (!ruleRes) return NextResponse.json({ error: "Rule 5-1-1 not found" });

    const revRes = await db.prepare(`SELECT id FROM Revision WHERE ruleId = ? ORDER BY version DESC LIMIT 1`).bind(ruleRes.id).first();
    if (!revRes) return NextResponse.json({ error: "Revision not found" });

    const articles = await db.prepare(`SELECT id, contentText, contentJson FROM Article WHERE revisionId = ?`).bind(revRes.id).all();

    let updatedCount = 0;

    for (const article of articles.results) {
      let changed = false;
      let textStr = article.contentText;
      let jsonStr = article.contentJson; // Note: D1 might return string if it's stored as string

      const replacements = [
        { from: /＜삭제 2026.02.24＞/g, to: '<삭제 2026.02.24.>' },
        { from: /<삭제 2026.02.24＞/g, to: '<삭제 2026.02.24.>' },
        { from: /<삭제 2026.02.24\\n/g, to: '<삭제 2026.02.24.>\n' },
        { from: /<삭제 2026.02.24"/g, to: '<삭제 2026.02.24.>"' },
        { from: /<개정2026.02.24>/g, to: '<개정 2026.02.24>' },
        { from: /재 입실 할 수 있다,<신설 2026.02.24>/g, to: '재 입실 할 수 있다.<신설 2026.02.24>' }
      ];

      for (const r of replacements) {
        if (textStr && textStr.match(r.from)) {
          textStr = textStr.replace(r.from, r.to);
          changed = true;
        }
        if (jsonStr && jsonStr.match(r.from)) {
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
