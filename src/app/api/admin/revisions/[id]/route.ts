export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let pool;
  let client;
  try {
    const { id: revisionId } = await params;
    
    pool = createPool();
    client = await pool.connect();
    
    // Check if revision exists and get ruleId
    const revRes = await client.query(`SELECT "ruleId", version FROM "Revision" WHERE id = $1`, [revisionId]);
    if (revRes.rows.length === 0) {
      return NextResponse.json({ error: "해당 개정 내역을 찾을 수 없습니다." }, { status: 404 });
    }
    const revision = revRes.rows[0];
    const ruleId = revision.ruleId;
    const version = revision.version;
    
    // Check if it's the latest revision
    const latestRes = await client.query(`SELECT version FROM "Revision" WHERE "ruleId" = $1 ORDER BY version DESC LIMIT 1`, [ruleId]);
    const latestVersion = latestRes.rows[0].version;
    
    if (version !== latestVersion) {
      return NextResponse.json({ error: "최신 개정 내역만 취소할 수 있습니다." }, { status: 400 });
    }

    await client.query("BEGIN");

    // Delete comparisons, articles, and then revision
    await client.query(`DELETE FROM "ArticleComparison" WHERE "revisionId" = $1`, [revisionId]);
    await client.query(`DELETE FROM "Article" WHERE "revisionId" = $1`, [revisionId]);
    await client.query(`DELETE FROM "Revision" WHERE id = $1`, [revisionId]);

    await client.query("COMMIT");
    return NextResponse.json({ success: true, message: "개정 내역이 성공적으로 취소되었습니다." });
  } catch (error: any) {
    if (client) {
      try { await client.query("ROLLBACK"); } catch (e) { console.error("Rollback error:", e); }
    }
    console.error("[Delete Revision Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  } finally {
    if (client) {
      try { client.release(); } catch (e) { console.error("Release error:", e); }
    }
    try { if (pool) await pool.end(); } catch (e) { console.error("Pool end error:", e); }
  }
}

// 개정내용(description) 및 제정일/시행일 수정 API
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let pool;
  try {
    const { id: revisionId } = await params;
    const body = await request.json() as { description?: string; enactmentDate?: string; effectiveDate?: string };
    const { description, enactmentDate, effectiveDate } = body;

    pool = createPool();

    // Check if revision exists
    const revRes = await pool.query(`SELECT id, "enactmentDate", "effectiveDate", description FROM "Revision" WHERE id = $1`, [revisionId]);
    if (revRes.rows.length === 0) {
      return NextResponse.json({ error: "해당 개정 내역을 찾을 수 없습니다." }, { status: 404 });
    }
    const current = revRes.rows[0];

    const newEnactmentDate = enactmentDate ? new Date(enactmentDate) : current.enactmentDate;
    const newEffectiveDate = effectiveDate ? new Date(effectiveDate) : current.effectiveDate;

    // Update description and dates
    await pool.query(
      `UPDATE "Revision" SET description = $1, "enactmentDate" = $2, "effectiveDate" = $3, "updatedAt" = NOW() WHERE id = $4`,
      [description !== undefined ? description : current.description, newEnactmentDate, newEffectiveDate, revisionId]
    );

    return NextResponse.json({ success: true, message: "개정 정보가 성공적으로 저장되었습니다." });
  } catch (error: any) {
    console.error("[Patch Revision Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  } finally {
    if (pool) await pool.end();
  }
}

