export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { getRequestContext } = await import("@cloudflare/next-on-pages");
    const ctx = getRequestContext();
    const env = ctx?.env as any;
    
    if (!env || !env.STORAGE) {
      return NextResponse.json(
        { error: "Cloudflare R2 스토리지 바인딩(STORAGE)을 찾을 수 없습니다." },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "파일이 제공되지 않았습니다." }, { status: 400 });
    }

    // 2MB 제한 (2 * 1024 * 1024 = 2097152 bytes)
    const MAX_FILE_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "파일 크기는 2MB를 초과할 수 없습니다." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // 고유 파일명(key) 생성
    const ext = file.name.split('.').pop();
    const uniqueFileName = `opinion_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
    
    // Cloudflare R2 버킷에 업로드
    await env.STORAGE.put(uniqueFileName, buffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Public API URL 생성 (기존 파일 다운로드 라우트 사용)
    const publicUrl = `/api/files/${uniqueFileName}`;

    return NextResponse.json({ 
      success: true, 
      fileUrl: publicUrl,
      fileName: file.name
    });
  } catch (error: any) {
    console.error("[Opinions API Upload Error]:", error);
    return NextResponse.json({ error: "파일 업로드 중 오류가 발생했습니다." }, { status: 500 });
  }
}
