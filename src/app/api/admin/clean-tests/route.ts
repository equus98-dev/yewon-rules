export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function GET(request: Request) {
  let pool;
  try {
    pool = createPool();
    
    // Delete Articles and Revisions that were created after 2026-06-01
    // We will check by enactmentDate string or timestamp
    
    // Get the revisions to delete
    const findRes = await pool.query(`
      SELECT id, "versionName", "enactmentDate" 
      FROM "Revision" 
      WHERE "enactmentDate" >= '2026-06-01' OR "createdAt" >= '2026-06-01' OR "createdAt" >= 1777593600000
    `);
    
    const ids = findRes.rows.map((r: any) => r.id);
    
    if (ids.length === 0) {
      return NextResponse.json({ message: "No test revisions found", revisions: [] });
    }
    
    // We must manually delete Articles because D1 foreign keys are off by default
    let articlesDeleted = 0;
    for (const rid of ids) {
       const delArt = await pool.query(`DELETE FROM "Article" WHERE "revisionId" = $1`, [rid]);
       // Depending on pg mock, rowCount might not be accurate, but it deletes them
    }
    
    // Delete Revisions
    let revisionsDeleted = 0;
    for (const rid of ids) {
       await pool.query(`DELETE FROM "Revision" WHERE id = $1`, [rid]);
       revisionsDeleted++;
    }
    
    return NextResponse.json({ 
      message: "Deleted test revisions successfully", 
      deletedRevisions: findRes.rows,
      revisionsDeleted,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
