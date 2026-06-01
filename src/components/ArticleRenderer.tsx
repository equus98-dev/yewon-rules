import React from "react";

interface ContentItem {
  type: "chapter" | "section" | "article" | "paragraph" | "item" | "subitem" | "text" | string;
  num: string;
  text: string;
}

interface ArticleRendererProps {
  id?: string;
  chapter?: string | null;
  section?: string | null;
  articleNumber: number;
  title: string;
  contentJson: any; // Prisma JsonValue
  contentHtml?: string | null;
  isSelectable?: boolean;
  selectedNums?: Set<string>;
  onToggleSelect?: (num: string) => void;
}

export default function ArticleRenderer({
  id,
  contentJson,
  contentHtml,
  isSelectable,
  selectedNums,
  onToggleSelect,
}: ArticleRendererProps) {
  if (contentHtml && contentHtml.trim().length > 0) {
    return (
      <div 
        className="mb-8 animate-fade-in rule-viewer-content font-['Pretendard'] ql-editor px-0 py-2"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    );
  }

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

  let hasSeenBody = false;

  return (
    <div className="mb-8 animate-fade-in rule-viewer-content font-['Pretendard']">
      {items.map((item, index) => {
        if (!item || typeof item !== 'object') return null;

        if (
          item.type === "chapter" ||
          item.type === "section" ||
          item.type === "article"
        ) {
          hasSeenBody = true;
        }

        if (item.type === "text" && typeof item.text === "string" && item.text.match(/\d-\d-\d-/)) {
          return null;
        }

        const safeNum = item.num !== null && item.num !== undefined ? String(item.num) : "";
        const safeText = item.text !== null && item.text !== undefined ? String(item.text) : "";

        if (item.type === "chapter") {
          return (
            <div key={index} id={`toc-${safeText.replace(/\s/g, '-')}`} className="text-center w-full block mt-10 mb-4 pt-4">
              <span className="text-[20px] font-bold text-[#0054FF]">
                {safeText}
              </span>
            </div>
          );
        } else if (item.type === "section") {
          return (
            <div key={index} className="text-center w-full block text-[18px] font-bold text-[#0054FF] mt-8 mb-4">
              {safeText}
            </div>
          );
        } else if (item.type === "article") {
          return (
            <div key={index} id={`toc-${safeNum}`} className="mt-6 mb-2 text-[15px] text-black leading-[1.6] flex items-start gap-2 pt-2">
              {isSelectable && onToggleSelect && (
                <input
                  type="checkbox"
                  checked={selectedNums ? selectedNums.has(safeNum) : false}
                  onChange={() => onToggleSelect(safeNum)}
                  className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
              )}
              <div>
                <span className="font-bold mr-1">{safeNum}</span>
                <span className="font-normal">{safeText}</span>
              </div>
            </div>
          );
        } else if (item.type === "paragraph") {
          return (
            <div key={index} className="flex text-black text-[15px] leading-[1.6] pl-[1.25rem] -ml-[1.25rem] mb-1">
              <span className="font-normal mr-1 w-5 shrink-0 text-right inline-block">{safeNum}</span>
              <span className="font-normal flex-1">{safeText}</span>
            </div>
          );
        } else if (item.type === "item") {
          return (
            <div key={index} className="flex text-black text-[15px] leading-[1.6] pl-[2.5rem] -ml-[1.25rem] mb-1">
              <span className="font-normal mr-1 w-6 shrink-0 text-right inline-block">{safeNum}</span>
              <span className="font-normal flex-1">{safeText}</span>
            </div>
          );
        } else if (item.type === "subitem") {
          return (
            <div key={index} className="flex text-black text-[15px] leading-[1.6] pl-[3.75rem] -ml-[1.25rem] mb-1">
              <span className="font-normal mr-1 w-6 shrink-0 text-right inline-block">{safeNum}</span>
              <span className="font-normal flex-1">{safeText}</span>
            </div>
          );
        } else {
          if (!hasSeenBody) {
            const isTitle = safeText.includes("학칙") || safeText.includes("규정") || safeText.includes("강령") || safeText.includes("내규") || safeText.includes("세칙") || safeText.includes("법령");
            const isHistory = safeText.includes("제정") || safeText.includes("개정") || safeText.includes("시행");
            
            return (
              <div key={index} className="text-center w-full my-2">
                {isTitle ? (
                  <h1 className="text-[32px] font-bold text-black my-6">{safeText}</h1>
                ) : isHistory ? (
                  <p className="text-[14px] text-blue-600 font-medium my-1">[{safeText}]</p>
                ) : (
                  <p className="text-[15px] text-black leading-[1.6]">{safeText}</p>
                )}
              </div>
            );
          } else {
            return (
              <div key={index} className="text-black text-[15px] leading-[1.6] my-1 pl-[1.25rem]">
                {safeText}
              </div>
            );
          }
        }
      })}
    </div>
  );
}
