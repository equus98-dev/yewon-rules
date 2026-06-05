export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function GET(request: Request) {
  let pool;
  try {
    pool = createPool();
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
    if (pool) await pool.end();
  }
}

export async function POST(request: Request) {
  let pool;
  try {
    pool = createPool();
    const { getRequestContext } = await import("@cloudflare/next-on-pages");
    const ctx = getRequestContext();
    const env = ctx?.env as any;
    
    if (!env || !env.STORAGE) {
      return NextResponse.json(
        { error: "Cloudflare R2 스토리지 바인딩(STORAGE)을 찾을 수 없습니다." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const ruleId = formData.get("ruleId") as string;
    const attachmentId = formData.get("attachmentId") as string;

    if (!file || !ruleId || !attachmentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // 고유 파일명(key) 생성
    const ext = file.name.split('.').pop();
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
    
    // Cloudflare R2 버킷에 업로드
    await env.STORAGE.put(uniqueFileName, buffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Public API URL 생성 (파일 다운로드용 라우트)
    const publicUrl = `/api/files/${uniqueFileName}`;

    // 데이터베이스 업데이트
    await pool.query(
      `UPDATE "Attachment" 
       SET "fileUrl" = $1, "fileSize" = $2, "fileType" = $3
       WHERE id = $4`,
      [publicUrl, file.size, ext?.toUpperCase() || 'HWP', attachmentId]
    );

    return NextResponse.json({ 
      success: true, 
      fileUrl: publicUrl 
    });
  } catch (error: any) {
    console.error("[Admin Files API POST Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  } finally {
    if (pool) await pool.end();
  }
}
