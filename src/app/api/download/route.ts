export const runtime = "edge";

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get("fileUrl");

    if (!fileUrl) {
      return NextResponse.json({ error: "Missing fileUrl parameter" }, { status: 400 });
    }

    // GitHub 레포지토리의 Raw URL 구성
    const githubRawUrl = `https://raw.githubusercontent.com/equus98-dev/yewon-rules/main/public${fileUrl}`;
    
    // GitHub에서 파일 가져오기
    const response = await fetch(githubRawUrl);
    
    if (!response.ok) {
      return NextResponse.json({ error: "File not found on remote storage" }, { status: 404 });
    }

    // 파일 이름 설정
    const reqFilename = searchParams.get("filename");
    const filename = reqFilename || (fileUrl.split('/').pop() || "download.file");
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
