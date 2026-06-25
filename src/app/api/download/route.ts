export const runtime = "edge";

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get("fileUrl");

    if (!fileUrl) {
      return NextResponse.json({ error: "Missing fileUrl parameter" }, { status: 400 });
    }

    if (fileUrl.startsWith('/api/files/')) {
      const redirectUrl = new URL(fileUrl, request.url);
      if (searchParams.get("inline") === "true") {
        redirectUrl.searchParams.set("inline", "true");
      } else {
        redirectUrl.searchParams.set("download", "true");
      }
      if (searchParams.get("filename")) {
        redirectUrl.searchParams.set("filename", searchParams.get("filename")!);
      }
      return NextResponse.redirect(redirectUrl);
    }

    let targetUrl = fileUrl;
    if (!fileUrl.startsWith('http')) {
      targetUrl = `https://raw.githubusercontent.com/equus98-dev/yewon-rules/main/public${fileUrl}`;
    }
    
    // 타겟 URL에서 파일 가져오기
    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      return NextResponse.json({ error: "File not found on remote storage", targetUrl: targetUrl }, { status: 404 });
    }

    // 파일 이름 설정
    const reqFilename = searchParams.get("filename");
    let filename = reqFilename || (fileUrl.split('/').pop() || "download.file");
    
    // 원본 fileUrl에서 확장자 추출 및 보완 (확장자가 누락된 경우)
    const extMatch = fileUrl.split('?')[0].match(/\.([a-zA-Z0-9]+)$/);
    if (extMatch) {
      const ext = extMatch[1];
      if (!filename.toLowerCase().endsWith(`.${ext.toLowerCase()}`)) {
        filename += `.${ext}`;
      }
    }

    // 한글 깨짐 방지를 위해 encodeURIComponent 사용
    const encodedFilename = encodeURIComponent(decodeURIComponent(filename));

    // 스트림 파이프 및 헤더 설정
    const inline = searchParams.get("inline") === "true";
    const disposition = inline ? "inline" : "attachment";
    
    let contentType = response.headers.get("Content-Type") || "application/octet-stream";
    if (inline && encodedFilename.toLowerCase().endsWith(".pdf")) {
       contentType = "application/pdf";
    }

    return new Response(response.body, {
      headers: {
        "Content-Disposition": `${disposition}; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
        "Content-Type": contentType,
      },
    });
  } catch (error) {
    console.error("Download proxy error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 400 });
  }
}
