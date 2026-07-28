export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createPool } from "@/lib/db";

export async function POST(request: Request) {
  let pool;
  try {
    const body = await request.json() as any;
    const { ruleId } = body;
    if (!ruleId) {
      return NextResponse.json({ error: "ruleId is required" }, { status: 400 });
    }

    pool = createPool();
    const attachmentsRes = await pool.query(
      `SELECT "fileUrl", "title" FROM "Attachment" WHERE "ruleId" = $1 ORDER BY "createdAt" ASC LIMIT 1`,
      [ruleId]
    );

    if (attachmentsRes.rows.length === 0) {
      return NextResponse.json({ error: "첨부된 규정 파일이 없습니다." }, { status: 404 });
    }

    const fileUrl = attachmentsRes.rows[0].fileUrl;
    const title = attachmentsRes.rows[0].title;
    const isPdf = title.toLowerCase().endsWith(".pdf") || fileUrl.toLowerCase().includes(".pdf");

    if (!isPdf) {
      return NextResponse.json({ error: "현재 PDF 파일만 AI 자동 추출을 지원합니다. PDF로 변환하여 다시 첨부해 주세요." }, { status: 400 });
    }

    // 환경 변수에서 Gemini API Key 가져오기
    const ctx = getRequestContext();
    const env = ctx?.env as any;
    const apiKey = env?.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: "서버에 GEMINI_API_KEY가 설정되어 있지 않습니다." }, { status: 500 });
    }

    // 파일 다운로드 (R2 스토리지에서 직접 가져오기)
    let arrayBuffer: ArrayBuffer;
    if (fileUrl.startsWith('/api/files/')) {
      const fileName = fileUrl.split('/').pop();
      if (!fileName) return NextResponse.json({ error: "잘못된 첨부파일 URL입니다." }, { status: 400 });
      
      if (!env || !env.STORAGE) {
        return NextResponse.json({ error: "Cloudflare R2 스토리지를 찾을 수 없습니다." }, { status: 500 });
      }
      const fileObj = await env.STORAGE.get(fileName);
      if (!fileObj) {
        return NextResponse.json({ error: "첨부파일을 스토리지에서 찾을 수 없습니다." }, { status: 404 });
      }
      arrayBuffer = await fileObj.arrayBuffer();
    } else {
      // 외부 절대 URL인 경우에만 fetch 사용
      const fileRes = await fetch(fileUrl);
      if (!fileRes.ok) {
        return NextResponse.json({ error: "첨부파일 다운로드에 실패했습니다." }, { status: 500 });
      }
      arrayBuffer = await fileRes.arrayBuffer();
    }

    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
당신은 대학 규정집 전문 분석 AI입니다. 첨부된 규정 문서(PDF)를 읽고, 문서에 포함된 모든 조문(Article) 정보를 추출하여 아래의 JSON 배열 형식으로만 응답하세요. (마크다운 백틱 등 부가적인 설명 없이 오직 순수한 JSON 배열만 반환해야 합니다.)

각 조문(Article)의 구조는 다음과 같아야 합니다:
[
  {
    "chapter": "제1장 총칙", // 해당 조문이 속한 장(Chapter). 장 구분이 없다면 빈 문자열("")
    "section": "제1절 일반", // 해당 조문이 속한 절(Section). 절 구분이 없다면 빈 문자열("")
    "articleNumber": "1", // 조문 번호 (예: 제1조 -> "1", 제3조의2 -> "3-2")
    "title": "목적", // 조문의 제목 (괄호 안의 내용 등)
    "contentText": "제1조(목적) 이 규정은...\\n① 항 내용...\\n1. 호 내용..." // 조문의 본문 전체 텍스트
  }
]

- 본문 텍스트(contentText)는 반드시 조문 번호와 제목(예: "제1조(목적)")을 포함한 원본 형태를 그대로 유지해야 합니다.
- 항(①, ②)과 호(1., 2.)는 줄바꿈(\\n)으로 명확히 구분되도록 해주세요.
- 부칙이 존재할 경우 부칙 내용 전체를 텍스트로 합쳐서, chapter="부칙", articleNumber="부칙", title="부칙" 형태의 1개 조문 객체로 만들어 배열 마지막에 포함하세요.
- 응답은 반드시 유효한 JSON 배열이어야 합니다.
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "application/pdf",
        },
      },
    ]);

    let responseText = result.response.text();
    responseText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
    
    let articles = [];
    try {
      articles = JSON.parse(responseText);
    } catch (e) {
      console.error("JSON 파싱 실패:", responseText);
      return NextResponse.json({ error: "AI가 반환한 데이터를 파싱할 수 없습니다." }, { status: 500 });
    }

    return NextResponse.json({ articles });
  } catch (error: any) {
    console.error("[Admin Extract Articles Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  } finally {
    if (pool) await pool.end();
  }
}
