import React from "react";

interface ContentItem {
  type: "paragraph" | "item" | "subitem" | string;
  num: string;
  text: string;
}

interface ArticleRendererProps {
  chapter?: string | null;
  section?: string | null;
  articleNumber: number;
  title: string;
  contentJson: any; // Prisma JsonValue
}

export default function ArticleRenderer({
  chapter,
  section,
  articleNumber,
  title,
  contentJson,
}: ArticleRendererProps) {
  // JSON 파싱 안전장치
  let items: ContentItem[] = [];
  try {
    if (typeof contentJson === "string") {
      items = JSON.parse(contentJson);
    } else if (Array.isArray(contentJson)) {
      items = contentJson as ContentItem[];
    }
  } catch (e) {
    console.error("Failed to parse contentJson:", e);
  }

  return (
    <div className="mb-6 animate-fade-in rule-viewer-content">
      {/* 장(Chapter) 표시 */}
      {chapter && (
        <div className="rule-chapter">
          {chapter}
        </div>
      )}

      {/* 절(Section) 표시 */}
      {section && (
        <div className="rule-section">
          {section}
        </div>
      )}

      {/* 조(Article) 표시 - 제1조(목적) 등 */}
      <div className="rule-article">
        <span className="text-blue-900 font-bold">제{articleNumber}조({title})</span>
      </div>

      {/* 항/호/목 하위 콘텐츠 정밀 들여쓰기 렌더링 */}
      <div className="mt-2 space-y-1">
        {items.map((item, index) => {
          if (item.type === "paragraph") {
            return (
              <div key={index} className="rule-paragraph">
                <span className="font-semibold text-blue-800 mr-1">{item.num}</span>
                {item.text}
              </div>
            );
          } else if (item.type === "item") {
            return (
              <div key={index} className="rule-item">
                <span className="font-medium text-slate-700 mr-1">{item.num}</span>
                {item.text}
              </div>
            );
          } else if (item.type === "subitem") {
            return (
              <div key={index} className="rule-subitem">
                <span className="text-slate-600 mr-1">{item.num}</span>
                {item.text}
              </div>
            );
          } else {
            // 기본 텍스트 렌더링
            return (
              <div key={index} className="pl-5 text-slate-800 text-sm">
                {item.num} {item.text}
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
