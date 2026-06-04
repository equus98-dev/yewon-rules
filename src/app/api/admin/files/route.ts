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
  const pool = createPool();
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase 설정이 누락되었습니다. (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 환경 변수를 확인해 주세요.)" },
        { status: 500 }
      );
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const ruleId = formData.get("ruleId") as string;
    const title = formData.get("title") as string;
    const attachmentId = formData.get("attachmentId") as string;

    if (!file || !ruleId || !title || !attachmentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // 고유 파일명 생성
    const ext = file.name.split('.').pop();
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
    
    // Supabase rules 버킷에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("rules")
      .upload(uniqueFileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[Supabase Upload Error]:", uploadError);
      return NextResponse.json({ error: `파일 업로드 실패: ${uploadError.message}` }, { status: 500 });
    }

    // Public URL 가져오기
    const { data: publicUrlData } = supabase.storage
      .from("rules")
      .getPublicUrl(uploadData.path);

    const publicUrl = publicUrlData.publicUrl;

    // 데이터베이스 업데이트
    await pool.query(
      `UPDATE "Attachment" 
       SET "fileUrl" = $1, "fileSize" = $2, "fileType" = $3
       WHERE id = $4`,
      [publicUrl, file.size, file.type, attachmentId]
    );

    return NextResponse.json({ 
      success: true, 
      fileUrl: publicUrl 
    });
  } catch (error: any) {
    console.error("[Admin Files API POST Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  } finally {
    await pool.end();
  }
}
