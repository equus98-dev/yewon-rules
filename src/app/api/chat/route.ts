export const runtime = "edge";

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createPool } from "@/lib/db";

import { getRequestContext } from "@cloudflare/next-on-pages";

export async function POST(req: Request) {
  let pool;
  try {
    const ctx = getRequestContext();
    const env = ctx?.env as any;
    const apiKey = env?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { reply: "서버에 GEMINI_API_KEY가 설정되어 있지 않습니다. Cloudflare 설정에서 환경 변수를 추가해주세요." },
        { status: 500 }
      );
    }

    const { message, history } = (await req.json()) as { message: string, history: any[] };
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 1. 키워드 추출 (간단하게 2글자 이상 단어)
    const keywords = message.split(/\s+/).filter((w: string) => w.length >= 2);
    
    // 2. DB에서 관련 규정 검색
    let contextText = "";
    if (keywords.length > 0) {
      pool = createPool();
      let conditions: string[] = [];
      let params: string[] = [];
      for (let i = 0; i < keywords.length; i++) {
        conditions.push(`"contentText" LIKE $${i + 1} OR title LIKE $${i + 1}`);
        params.push(`%${keywords[i]}%`);
      }
      
      const sql = `SELECT title, "contentText", chapter, section 
                   FROM "Article" 
                   WHERE ${conditions.join(" OR ")} 
                   LIMIT 15`;
                   
      const res = await pool.query(sql, params);
      
      if (res.rows && res.rows.length > 0) {
        contextText = "다음은 예원예술대학교 규정 DB에서 발췌한 참고 자료입니다:\n\n" + 
          res.rows.map((row: any) => 
            `[${row.chapter || ''} ${row.section || ''} ${row.title}] ${row.contentText}`
          ).join("\n\n");
      }
    }

    // 3. Gemini 호출
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel(
      { model: "gemini-2.5-flash" }, 
      { apiVersion: "v1beta" }
    );

    const systemPrompt = `당신은 예원예술대학교의 규정과 학칙을 친절하고 정확하게 안내하는 AI 어시스턴트입니다.
답변할 때는 가독성을 위해 마크다운(Markdown)을 적절히 사용해 주세요.
반드시 아래 제공된 [참고 자료]를 바탕으로 답변하세요.

[참고 자료]
${contextText}

[지시사항]
1. 위 '참고 자료'에 포함된 규정 내용에 기반하여 답변을 작성하세요.
2. 만약 질문 내용이 참고 자료에 없거나 대학교 규정과 관련이 없다면, "제공된 규정 자료에서는 해당 내용을 찾을 수 없습니다."라고 안내하세요.
3. 질문에 국가 법령 등과 비교하는 내용이 포함되어 있다면, 당신의 사전 학습된 지식을 바탕으로 대학 규정과 국가 법령 간의 차이나 비교 분석을 제공해 주세요.`;

    const chat = model.startChat({
      history: history,
    });

    const result = await chat.sendMessage(systemPrompt + "\n\n사용자 질문: " + message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ reply: text });

  } catch (error: any) {
    console.error("[Chat API Error]:", error);
    
    let availableModels = "";
    try {
      const apiKey = process.env.GEMINI_API_KEY || (getRequestContext()?.env as any)?.GEMINI_API_KEY;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const data = await res.json() as any;
      if (data.models) {
        availableModels = data.models.map((m: any) => m.name.replace("models/", "")).join(", ");
      } else {
        availableModels = JSON.stringify(data);
      }
    } catch (e) {
      availableModels = "조회 실패";
    }

    return NextResponse.json(
      { reply: `오류가 발생했습니다: ${error.message}\n\n[디버깅] 사용 가능한 모델 목록:\n${availableModels}` },
      { status: 500 }
    );
  } finally {
    if (pool) await pool.end();
  }
}
