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
    
    // 2. DB에서 관련 규정 검색 (관련도 점수 기반 정렬)
    let contextText = "";
    if (keywords.length > 0) {
      pool = createPool();
      let conditions: string[] = [];
      let params: string[] = [];
      let scoreCases: string[] = [];
      
      for (let i = 0; i < keywords.length; i++) {
        const p = `$${i + 1}`;
        conditions.push(`(a."contentText" LIKE ${p} OR a.title LIKE ${p} OR r.title LIKE ${p})`);
        scoreCases.push(`
          (CASE WHEN r.title LIKE ${p} THEN 5 ELSE 0 END) +
          (CASE WHEN a.title LIKE ${p} THEN 3 ELSE 0 END) +
          (CASE WHEN a."contentText" LIKE ${p} THEN 1 ELSE 0 END)
        `);
        params.push(`%${keywords[i]}%`);
      }
      
      const sql = `
        SELECT a.title as articleTitle, a."contentText", a.chapter, a.section, r.title as ruleTitle,
               (${scoreCases.join(" + ")}) as relevance
        FROM "Article" a
        JOIN "Revision" rev ON a."revisionId" = rev.id
        JOIN "Rule" r ON rev."ruleId" = r.id
        WHERE ${conditions.join(" OR ")} 
        ORDER BY relevance DESC
        LIMIT 15
      `;
                   
      const res = await pool.query(sql, params);
      
      if (res.rows && res.rows.length > 0) {
        contextText = "다음은 예원예술대학교 규정 DB에서 발췌한 참고 자료입니다:\n\n" + 
          res.rows.map((row: any) => 
            `[규정명: ${row.ruleTitle}] ${row.chapter || ''} ${row.section || ''} ${row.articleTitle}\n내용: ${row.contentText}`
          ).join("\n\n");
      }
    }

    // 3. Gemini 호출
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 무료 할당량(Quota) 초과 방지를 위해 여러 모델을 순차적으로 시도 (Fallback)
    const fallbackModels = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-3.5-flash",
      "gemini-pro-latest"
    ];

    let text = "";
    let success = false;
    let lastError: any = null;

    const systemPrompt = `당신은 예원예술대학교의 규정과 학칙을 친절하고 정확하게 안내하는 AI 어시스턴트입니다.
답변할 때는 가독성을 위해 마크다운(Markdown)을 적절히 사용해 주세요.
반드시 아래 제공된 [참고 자료]를 바탕으로 답변하세요.

[참고 자료]
${contextText}

[지시사항]
1. 위 '참고 자료'에 포함된 규정 내용에 기반하여 답변을 작성하세요.
2. 만약 질문 내용이 참고 자료에 없거나 대학교 규정과 관련이 없다면, "제공된 규정 자료에서는 해당 내용을 찾을 수 없습니다."라고 안내하세요.
3. 질문에 국가 법령 등과 비교하는 내용이 포함되어 있다면, 당신의 사전 학습된 지식을 바탕으로 대학 규정과 국가 법령 간의 차이나 비교 분석을 제공해 주세요.`;

    for (const modelName of fallbackModels) {
      try {
        const model = genAI.getGenerativeModel(
          { model: modelName }, 
          { apiVersion: "v1beta" }
        );

        const chat = model.startChat({
          history: history,
        });

        const result = await chat.sendMessage(systemPrompt + "\\n\\n사용자 질문: " + message);
        const response = await result.response;
        text = response.text();
        success = true;
        break; // 모델 호출에 성공하면 루프 탈출
      } catch (err: any) {
        lastError = err;
        console.warn(`[Chat API] ${modelName} 모델 호출 실패, 다음 모델 시도 중... 오류:`, err.message);
      }
    }

    if (!success) {
      if (lastError?.message?.includes("429") || lastError?.message?.includes("quota") || lastError?.message?.includes("Quota")) {
        return NextResponse.json({ reply: "현재 AI 챗봇의 모든 무료 사용량이 소진되었습니다. 잠시 후 다시 시도해주시거나, 다른 질문을 남겨주세요." });
      }
      throw lastError || new Error("모든 AI 모델 호출에 실패했습니다.");
    }

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
