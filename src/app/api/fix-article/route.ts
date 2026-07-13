export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function GET() {
  const pool = createPool();
  try {
    const res = await pool.query(`DELETE FROM "Article" WHERE id = '3098feae-eceb-40e9-bd07-088a303b9a7a'`);
    return NextResponse.json({ success: true, rows: res.rowCount });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
