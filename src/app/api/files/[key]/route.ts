export const runtime = "edge";

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { getRequestContext } = await import("@cloudflare/next-on-pages");
    const ctx = getRequestContext();
    const env = ctx?.env as any;

    if (!env || !env.STORAGE) {
      return NextResponse.json(
        { error: "Cloudflare R2 Storage binding not found" },
        { status: 400 }
      );
    }

    const { key } = await params;
    if (!key) {
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }

    // R2 버킷에서 파일 가져오기
    const object = await env.STORAGE.get(key);

    if (!object) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // 헤더 설정
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    
    // 파일명 추출 로직 (다운로드 시 필요할 수 있음)
    const encodedFilename = encodeURIComponent(key);
    
    // PDF일 경우 브라우저 인라인 미리보기 허용, 나머지는 다운로드 (단, 쿼리에 download=true가 있으면 강제 다운로드)
    const url = new URL(request.url);
    const forceDownload = url.searchParams.get("download") === "true";
    const isPdf = key.toLowerCase().endsWith(".pdf") || object.httpMetadata?.contentType === "application/pdf";
    
    if (!forceDownload && isPdf) {
      headers.set("Content-Type", "application/pdf");
      headers.set("Content-Disposition", `inline; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
    } else {
      headers.set("Content-Disposition", `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
    }

    // 스트림 파이프
    return new Response(object.body, {
      headers,
    });
  } catch (error: any) {
    console.error("[Files API GET Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 400 });
  }
}
