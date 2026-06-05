export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function GET() {
  const pool = createPool();
  try {
    const res = await pool.query(`
      SELECT 
        a.id,
        a.title,
        a."fileUrl",
        a."fileType",
        a."ruleId",
        a."createdAt",
        r.title AS "ruleTitle",
        r."ruleNumber"
      FROM "Attachment" a
      LEFT JOIN "Rule" r ON a."ruleId" = r.id
      ORDER BY a.title ASC
    `);
    return NextResponse.json(res.rows);
  } catch (error: any) {
    console.error("[Attachments GET Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  } finally {
    await pool.end();
  }
}
