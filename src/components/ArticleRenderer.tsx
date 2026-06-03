import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

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
  hideHistory?: boolean;
}

export default function ArticleRenderer({
  id,
  title = "",
  articleNumber,
  contentJson,
  contentHtml,
  hideHistory = false,
}: ArticleRendererProps) {
  const [modalHistory, setModalHistory] = useState<string[] | null>(null);

  if (contentHtml && contentHtml.trim().length > 0) {
    // 제목이나 내용에 조직도/기구표가 있으면 인라인 스타일을 우선하는 org-chart-wrapper 적용
    const isOrgChart = title.includes("조직도") || title.includes("기구표") || contentHtml.includes("조직도");
    const wrapperClass = isOrgChart ? "org-chart-wrapper" : "html-table-wrapper";

    return (
      <div id={id} className="animate-fade-in rule-viewer-content font-['Pretendard'] w-full">
        {articleNumber >= 9000 && (
          <div className="mt-16 mb-8 border-t-2 border-slate-300 pt-10 text-center w-full">
            <span className="text-[22px] font-black text-[#000080] tracking-tight">{title}</span>
          </div>
        )}
        <div 
          className={`mb-8 ql-editor ${wrapperClass} px-0 py-2 w-full`}
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </div>
    );
  }

  let items: ContentItem[] = [];
  try {
    let parsed = contentJson;
    if (typeof contentJson === "string") {
      parsed = JSON.parse(contentJson);
    }
    
    if (Array.isArray(parsed)) {
      items = parsed as ContentItem[];
    } else if (parsed && typeof parsed === "object") {
      if (Array.isArray(parsed.paragraphs)) {
        items = parsed.paragraphs.map((p: any) => ({ type: "paragraph", num: "", text: String(p) }));
      } else {
        items = [];
      }
    }
  } catch (e) {
    console.error("Failed to parse contentJson:", e);
  }

  if (!Array.isArray(items)) {
    items = [];
  }

  // 본문 하단(또는 부칙 하단)에 딸려들어온 별표/별지/서식 텍스트는 이미지 첨부파일로 대체되므로, 본문 렌더링에서 제외합니다.
  const attachmentStartIndex = items.findIndex((item) => {
    if (!item || !item.text) return false;
    const textStr = String(item.text).trim();
    return textStr.startsWith("[별지") || textStr.startsWith("[별표") || textStr.startsWith("[서식");
  });

  if (attachmentStartIndex !== -1) {
    items = items.slice(0, attachmentStartIndex);
  }

  let hasSeenBody = false;
  let addendumStarted = false;

  const isAddendumItem = (text: string) =>
    /^\(시행일\)|^\(폐지|^\(적용예외|^\(경과조치|^\(적용범위|^\(준용\)/.test(text.trim());

  // 정규식: <개정 ...> 또는 <신설 ...> 등 연혁 텍스트를 파싱하여 스타일을 다르게 적용
  const renderTextWithHistory = (text: string) => {
    // DB에 &lt;table&gt; 과 같이 이스케이프되어 저장된 경우를 대비해 디코딩
    let decodedText = text
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&nbsp;/g, " ")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    if (hideHistory) {
      // 연혁 숨기기
      decodedText = decodedText.replace(/<(?:개정|제정|신설|삭제|본조신설|전문개정|단서신설|후단신설|변경)[^>]*>/gi, "");
    }
    
    // 연혁 표시: <개정 ...> 부분을 파란색으로 렌더링하기 위한 문자열 준비
    let htmlText = decodedText.replace(
      /(<(?:개정|제정|신설|삭제|본조신설|전문개정|단서신설|후단신설|변경)[^>]*>)/gi,
      (match) => `<span class="text-[#000080] text-[13px] ml-1">${match.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`
    );

    // 테이블 등 HTML 태그가 포함되어 있다면 dangerouslySetInnerHTML 사용
    if (/<table|<tr|<td|<th|<br|<p/i.test(htmlText)) {
      return (
        <div 
          className="html-table-wrapper block w-full overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: htmlText }} 
        />
      );
    }

    const parts = decodedText.split(/(<(?:개정|제정|신설|삭제|본조신설|전문개정|단서신설|후단신설|변경)[^>]*>)/gi);
    return parts.map((part, i) => {
      if (part.startsWith("<") && part.endsWith(">")) {
        return <span key={i} className="text-[#000080] text-[13px] ml-1">{part}</span>;
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  return (
    <div id={id} className="mb-6 animate-fade-in rule-viewer-content font-['Pretendard']">
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

        if (item.type === "chapter" || item.type === "section") {
          const isChapter = item.type === "chapter";
          if (index > 0 && items[index - 1]?.type === item.type && items[index - 1]?.text === item.text) return null;
          
          let titlePart = safeText;
          let historyParts: string[] = [];
          
          const historyRegex = /(<[^>]+>)/g;
          const matches = safeText.match(historyRegex);
          if (matches) {
             historyParts = matches;
             titlePart = safeText.replace(historyRegex, "").trim();
          }

          const containerClass = isChapter 
            ? "text-center w-full mt-12 mb-6 pt-4 flex flex-col items-center gap-1.5"
            : "text-center w-full mt-8 mb-4 flex flex-col items-center gap-1";
          
          const titleClass = isChapter
            ? "text-[20px] font-black text-[#000080] tracking-tight"
            : "text-[18px] font-bold text-[#000080]";

          return (
            <div key={index} id={isChapter ? `toc-${safeText.replace(/\s/g, '-')}` : undefined} className={containerClass}>
              <span className={titleClass}>
                {titlePart}
              </span>
              {!hideHistory && historyParts.length > 0 && (
                <span className="text-[#000080] text-[13px] font-medium">
                  {historyParts.join(" ")}
                </span>
              )}
            </div>
          );
        } else if (item.type === "article") {
          // 뱃지 및 연혁 생성 로직
          let historyDates = [];
          for (let i = index; i < items.length; i++) {
            if (i !== index && items[i]?.type === "article") break;
            const textStr = String(items[i]?.text || "");
            if (textStr.includes("<제정")) {
              const match = textStr.match(/<제정(.*?)>/);
              if (match) historyDates.push(`제정 ${match[1].trim()}`);
            }
            if (textStr.includes("<개정")) {
              const match = textStr.match(/<개정(.*?)>/);
              if (match) historyDates.push(`개정 ${match[1].trim()}`);
            }
          }

          // 뱃지 결정 (임의로 개정 이력이 있으면 [개], 없으면 [연] 표시)
          const badgeType = historyDates.some(h => h.includes("개정")) ? "개" : "연";
          const badgeColor = badgeType === "개" ? "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100" : "bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100";

          // 제목 추출 (예: "(목적)")
          let parsedTitle = "";
          let parsedBody = safeText;
          if (safeText.startsWith("(")) {
            const match = safeText.match(/^(\([^)]+\))(.*)/);
            if (match) {
              parsedTitle = match[1];
              parsedBody = match[2];
            }
          }

          return (
            <div key={index} id={`toc-${safeNum}`} className="mt-8 mb-2 text-[14.5px] text-slate-800 leading-[1.7] flex items-start gap-2 pt-2 relative w-full">
              {!hideHistory && (
                <button 
                  onClick={() => setModalHistory(historyDates.length > 0 ? historyDates : ["개정 이력이 없습니다."])}
                  className={`w-5 h-5 shrink-0 flex items-center justify-center rounded text-[11px] font-bold mt-0.5 cursor-pointer transition-colors ${badgeColor}`}
                >
                  {badgeType}
                </button>
              )}
              <div className="flex-1 w-full flex flex-col md:flex-row md:items-baseline md:justify-between">
                <div className="flex-1">
                  <span className="font-bold mr-1 text-[#000080]">{safeNum}{parsedTitle}</span>
                  <span className="font-normal text-slate-800">{renderTextWithHistory(parsedBody)}</span>
                </div>
              </div>
            </div>
          );
        } else if (item.type === "paragraph") {
          return (
            <div key={index} className="flex text-slate-800 text-[14.5px] leading-[1.7] pl-[1.25rem] -ml-[1.25rem] mb-1.5 w-full">
              <span className="font-normal mr-1 w-5 shrink-0 text-right inline-block text-slate-600">{safeNum}</span>
              <span className="font-normal flex-1">{renderTextWithHistory(safeText)}</span>
            </div>
          );
        } else if (item.type === "item") {
          const isAddendum = isAddendumItem(safeText);

          return (
            <React.Fragment key={index}>
              <div className={`flex text-slate-800 text-[14.5px] leading-[1.7] ${isAddendum ? 'pl-[2rem]' : 'pl-[2.5rem]'} -ml-[1.25rem] mb-1.5 w-full`}>
                <span className="font-normal mr-1 w-6 shrink-0 text-right inline-block text-slate-600">{safeNum}</span>
                <span className="font-normal flex-1">{renderTextWithHistory(safeText)}</span>
              </div>
            </React.Fragment>
          );
        } else if (item.type === "subitem") {
          return (
            <div key={index} className="flex text-slate-800 text-[14.5px] leading-[1.7] pl-[3.75rem] -ml-[1.25rem] mb-1.5 w-full">
              <span className="font-normal mr-1 w-6 shrink-0 text-right inline-block text-slate-600">{safeNum}</span>
              <span className="font-normal flex-1">{renderTextWithHistory(safeText)}</span>
            </div>
          );
        } else {
          if (!hasSeenBody && articleNumber < 8000) {
            const isTitle = safeText.includes("학칙") || safeText.includes("규정") || safeText.includes("강령") || safeText.includes("내규") || safeText.includes("세칙") || safeText.includes("법령");
            const isHistory = safeText.includes("제정") || safeText.includes("개정") || safeText.includes("시행");
            
            return (
              <div key={index} className="text-center w-full my-2">
                {isTitle ? (
                  <h1 className="text-[24px] font-bold text-slate-800 my-6">{safeText}</h1>
                ) : isHistory && !hideHistory ? (
                  <p className="text-[14px] text-blue-600 font-medium my-1">[{safeText}]</p>
                ) : !isHistory ? (
                  <p className="text-[14.5px] text-slate-800 leading-[1.7]">{renderTextWithHistory(safeText)}</p>
                ) : null}
              </div>
            );
          } else {
            const isAddendum = safeText.replace(/\s+/g, "").startsWith("부칙");
            return (
              <div key={index} className={`text-slate-800 text-[14.5px] leading-[1.7] w-full ${isAddendum ? 'mt-16 mb-4 font-bold text-[16px] text-left border-t-2 border-slate-300 pt-8' : 'pl-[1.25rem] my-1.5'}`}>
                {renderTextWithHistory(safeText)}
              </div>
            );
          }
        }
      })}

      <Dialog open={modalHistory !== null} onClose={() => setModalHistory(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ p: 0 }}>
          <div className="flex justify-between items-center bg-slate-50 border-b border-slate-200 px-4 py-3">
            <span className="text-[15px] font-bold text-slate-800">개정 이력</span>
            <IconButton size="small" onClick={() => setModalHistory(null)} sx={{ p: 0.5 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent className="p-6 bg-white">
          <pre className="whitespace-pre-wrap text-[13.5px] font-['Pretendard'] text-slate-700 leading-relaxed font-medium mt-2">
            {modalHistory?.join("\n")}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
