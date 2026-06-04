export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const env = process.env as any;
    if (!env || !env.STORAGE) {
      return new NextResponse("Cloudflare R2 스토리지 바인딩(STORAGE)을 찾을 수 없습니다.", { status: 500 });
    }
    const r2 = env.STORAGE;
    const { key } = await params;
    if (!key) {
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }

    // R2 버킷에서 파일 가져오기
    const object = await r2.get(key);

    if (!object) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // 헤더 설정
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    
    // 파일명 추출 로직 (다운로드 시 필요할 수 있음)
    const encodedFilename = encodeURIComponent(key);
    headers.set("Content-Disposition", `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);

    // 스트림 파이프
    return new Response(object.body, {
      headers,
    });
  } catch (error: any) {
    console.error("[Files API GET Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
