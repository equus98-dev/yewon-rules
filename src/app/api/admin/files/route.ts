// export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function GET(request: Request) {
  const pool = createPool();
  try {
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get("ruleId");

    if (!ruleId) {
      return NextResponse.json({ error: "Missing ruleId" }, { status: 400 });
    }

    const res = await pool.query(
      `SELECT id, title, "fileUrl", "fileSize", "fileType", "createdAt" 
       FROM "Attachment" 
       WHERE "ruleId" = $1
       ORDER BY "createdAt" ASC`,
      [ruleId]
    );

    return NextResponse.json(res.rows);
  } catch (error: any) {
    console.error("[Admin Files API GET Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  } finally {
    await pool.end();
  }
}

export async function POST(request: Request) {
  return NextResponse.json(
    { 
      error: "현재 시스템은 Cloudflare Pages 클라우드 서버에 배포되어 있어 로컬 파일 업로드가 지원되지 않습니다. 실제 HWP 파일을 업로드하시려면 개발자에게 Supabase Storage 연동을 요청해 주세요." 
    }, 
    { status: 501 } // 501 Not Implemented
  );
}
