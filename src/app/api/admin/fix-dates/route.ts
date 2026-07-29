import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const pool = createPool();
    const client = await pool.connect();
    
    // Update specific revisions
    await client.query(
      `UPDATE "Revision" SET "versionName" = '2026. 7. 22. (제정)', "enactmentDate" = '2026-07-22', "effectiveDate" = '2026-07-22' WHERE "versionName" = '2026. 7. 29. (제정)' AND "revisionType" = 'ENACTMENT' AND version = 1`
    );
    
    return NextResponse.json({ success: true, message: "Fixed dates" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
