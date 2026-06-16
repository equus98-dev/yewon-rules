import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// 별표/별지/서식 등 부칙 마지막 article의 contentJson에서 찌꺼기 데이터 제거
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const execute = searchParams.get("execute") === "true";
  let pool;

  try {
    pool = createPool();

    // contentJson이 있는 모든 Article 가져오기
    const artsRes = await pool.query(`
      SELECT id, "articleNumber", title, "contentJson"
      FROM "Article"
      WHERE "contentJson" IS NOT NULL AND "contentJson" != '[]' AND "contentJson" != ''
    `);

    const logs: any[] = [];
    let fixedCount = 0;

    for (const art of artsRes.rows) {
      let items: any[];
      try {
        items = JSON.parse(art.contentJson);
      } catch {
        continue;
      }

      if (!Array.isArray(items) || items.length === 0) continue;

      // [별표], [별지], [별첨], [서식] 로 시작하는 아이템의 첫 번째 인덱스 찾기
      let cutIdx = -1;
      for (let i = 0; i < items.length; i++) {
        const itemText = String(items[i].text || "").trim();
        if (/^[\[〔【<]\s*(별표|별지|서식|별첨)/.test(itemText)) {
          cutIdx = i;
          break;
        }
      }

      if (cutIdx === -1) continue; // 찌꺼기 없음

      const cleanedItems = items.slice(0, cutIdx);
      const newJson = JSON.stringify(cleanedItems);

      logs.push({
        id: art.id,
        title: art.title,
        originalLength: items.length,
        cleanedLength: cleanedItems.length,
        removedFrom: items[cutIdx]?.text?.substring(0, 50),
      });

      if (execute) {
        await pool.query(
          `UPDATE "Article" SET "contentJson" = $1 WHERE id = $2`,
          [newJson, art.id]
        );
        fixedCount++;
      }
    }

    return NextResponse.json({
      mode: execute ? "EXECUTE" : "DRY_RUN",
      totalFixed: execute ? fixedCount : logs.length,
      logs,
    });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    await pool?.end();
  }
}
