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
  articleId?: string;
  chapter?: string | null;
  section?: string | null;
  articleNumber: number;
  title: string;
  contentJson: any; // Prisma JsonValue
  contentHtml?: string | null;
  hideHistory?: boolean;
  hasHtmlAttachments?: boolean;
  isAdmin?: boolean;
}

export default function ArticleRenderer({
  id,
  articleId,
  title = "",
  articleNumber,
  contentJson,
  contentHtml,
  hideHistory = false,
  hasHtmlAttachments = true,
  isAdmin = false,
}: ArticleRendererProps) {
  const [modalHistory, setModalHistory] = useState<string[] | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editItems, setEditItems] = useState<ContentItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editHistory, setEditHistory] = useState<{ id: string, createdAt: string, beforeText: string }[]>([]);

  if (contentHtml && contentHtml.trim().length > 0) {
    // 제목이나 내용에 조직도/기구표가 있으면 인라인 스타일을 우선하는 org-chart-wrapper 적용
    const isOrgChart = title.includes("조직도") || title.includes("기구표") || contentHtml.includes("조직도");
    const wrapperClass = isOrgChart ? "org-chart-wrapper" : "html-table-wrapper";

    let cleanHtml = contentHtml;
    if (articleNumber >= 9000) {
      // HWP 파싱 중 HTML 자체에 별지 제목이 중복 포함된 경우 이를 제거 (첫 번째 P 태그가 제목인 경우)
      const match = cleanHtml.match(/^(\s*<p[^>]*>.*?<\/p>\s*)/i);
      if (match) {
        const pText = match[0].replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
        if (/^(?:\[|〔)(별지|별표|서식)/.test(pText)) {
          cleanHtml = cleanHtml.replace(match[0], '');
        }
      }
    }

    return (
      <div id={id} className="animate-fade-in rule-viewer-content font-['Pretendard'] w-full">
        {articleNumber >= 9000 && (
          <div className="mt-16 mb-8 border-t-2 border-slate-300 pt-10 text-left w-full">
            <span className="text-[20px] font-black text-[#000080] tracking-tight">{title}</span>
          </div>
        )}
        <div 
          className={`mb-8 ql-editor ${wrapperClass} px-0 py-2 w-full`}
          dangerouslySetInnerHTML={{ __html: cleanHtml }}
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

  let textAttachments: ContentItem[] = [];

  const attachmentStartIndex = items.findIndex((item) => {
    if (!item || !item.text) return false;
    const textStr = String(item.text).trim();
    return /^(?:\[|〔)(별지|별표|서식)/.test(textStr);
  });

  if (attachmentStartIndex !== -1) {
    if (hasHtmlAttachments) {
      // 본문 하단(또는 부칙 하단)에 딸려들어온 별표/별지/서식 텍스트는 별도 HTML 첨부파일이 있으므로 숨김 처리
      items = items.slice(0, attachmentStartIndex);
    } else {
      // HTML 첨부파일이 없는 규정의 경우(예: 문화예술대학원 학사운영 규정) 텍스트를 별지 데이터로 살려서 렌더링
      textAttachments = items.slice(attachmentStartIndex);
      items = items.slice(0, attachmentStartIndex);
    }
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
        return <span key={i} className="text-blue-500 text-[13px] ml-1">{part}</span>;
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  // 파서 오류로 하나로 뭉쳐진 장/조/호 배열 텍스트를 정규식으로 동적 분할 및 포맷팅해주는 헬퍼
  const formatGluedText = (text: string, isArticleBody: boolean = false) => {
    if (text.length < 50 || /<table|<tr|<td|<th/i.test(text)) {
        return <span className={isArticleBody ? "font-normal text-slate-800" : ""}>{renderTextWithHistory(text)}</span>;
    }

    let formatted = text
      .replace(/(①|②|③|④|⑤|⑥|⑦|⑧|⑨|⑩|⑪|⑫|⑬|⑭|⑮)/g, '\n$1')
      .replace(/(?<!\d+\.\s*)(?<!\d)(\d{1,2}\.)\s+(?=[^\d])/g, '\n$1 ')
      .replace(/(^|\s)([가-하]\.)\s+/g, '$1\n$2 ')
      .replace(/(제\d+조의?\d*\([^)]+\))/g, '\n\n$1')
      .replace(/(제\d+장\s+[^\s]+)/g, '\n\n$1');

    const lines = formatted.split('\n').map(l => l.trim()).filter(l => l);

    return (
      <>
        {lines.map((trimmed, idx) => {
          let lineClass = "break-keep";
          let isInline = false;

          if (/^[①-⑮]/.test(trimmed)) {
             const numMatch = trimmed.match(/^([①-⑮])\s*(.*)/);
             if (numMatch) {
               return (
                  <div key={`glued-${idx}`} className="mt-1 mb-1.5 w-full break-keep text-slate-800" style={{ paddingLeft: '20px', textIndent: '-20px' }}>
                     <span className="font-normal mr-1">{numMatch[1]}</span>
                     <span className="font-normal">{renderTextWithHistory(numMatch[2])}</span>
                  </div>
               );
             }
             lineClass += " mt-2 text-slate-800 block";
          } else if (/^\d{1,2}\./.test(trimmed)) {
             const numMatch = trimmed.match(/^(\d{1,2}\.)\s*(.*)/);
             if (numMatch) {
               return (
                  <div key={`glued-${idx}`} className="mt-1 mb-1.5 w-full break-keep text-slate-800" style={{ paddingLeft: '36px', textIndent: '-16px' }}>
                     <span className="font-normal mr-1">{numMatch[1]}</span>
                     <span className="font-normal">{renderTextWithHistory(numMatch[2])}</span>
                  </div>
               );
             }
             lineClass += " ml-2 text-slate-700 block mt-2";
          } else if (/^[가-하]\./.test(trimmed)) {
             const numMatch = trimmed.match(/^([가-하]\.)\s*(.*)/);
             if (numMatch) {
               return (
                  <div key={`glued-${idx}`} className="mt-1 mb-1.5 w-full break-keep text-slate-800" style={{ paddingLeft: '52px', textIndent: '-16px' }}>
                     <span className="font-normal mr-1">{numMatch[1]}</span>
                     <span className="font-normal">{renderTextWithHistory(numMatch[2])}</span>
                  </div>
               );
             }
             lineClass += " ml-4 text-slate-700 block mt-1";
          } else if (/^제\d+조/.test(trimmed)) {
             const match = trimmed.match(/^(제\d+조의?\d*\([^)]+\))(.*)/);
             if (match) {
                 const title = match[1];
                 const body = match[2].trim();
                 return (
                    <div key={`glued-${idx}`} className="mt-8 text-[16px] block break-keep">
                       <span className="font-bold mr-1 text-[#000080]">{title}</span>
                       <span className="font-normal text-slate-800">{renderTextWithHistory(body)}</span>
                    </div>
                 );
             } else {
                 lineClass += " mt-8 text-[16px] font-bold text-[#000080] block";
             }
          } else if (/^제\d+장/.test(trimmed)) {
             lineClass += " mt-12 text-[18px] font-black text-center text-[#000080] block";
          } else {
             if (idx === 0 && isArticleBody) {
                isInline = true;
                lineClass += " font-normal text-slate-800";
             } else {
                lineClass += " block mt-1";
             }
          }

          if (isInline) {
             return <span key={`glued-${idx}`} className={lineClass}>{renderTextWithHistory(trimmed)} </span>;
          }

          return (
            <div key={`glued-${idx}`} className={lineClass}>
              {renderTextWithHistory(trimmed)}
            </div>
          );
        })}
      </>
    );
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
        const isSubsection = item.type === "text" && /^제\d+관/.test(safeText.trim());

        if (item.type === "chapter" || item.type === "section" || isSubsection) {
          const isChapter = item.type === "chapter";
          if (index > 0 && items[index - 1]?.type === item.type && items[index - 1]?.text === item.text) return null;
          
          let titlePart = safeText.trim();
          let historyParts: string[] = [];
          
          const historyRegex = /(<[^>]+>|\([^)]*(개정|삭제|신설|전문개정|본조신설)[^)]*\))/g;
          const matches = titlePart.match(historyRegex);
          if (matches) {
             historyParts = matches;
             titlePart = titlePart.replace(historyRegex, "").trim();
          }

          const containerClass = isChapter 
            ? "text-center w-full mt-12 mb-6 pt-4 flex flex-col items-center gap-1.5"
            : (isSubsection ? "text-center w-full mt-8 mb-4 flex flex-col items-center gap-1" : "text-center w-full mt-10 mb-4 flex flex-col items-center gap-1");
          
          const titleClass = isChapter
            ? "text-[20px] font-black text-[#000080] tracking-tight"
            : (isSubsection ? "text-[16px] font-bold text-slate-700" : "text-[18px] font-bold text-[#000080]");

          return (
            <div key={index} id={isChapter || item.type === 'section' || isSubsection ? `toc-${safeText.trim().replace(/\s/g, '-')}` : undefined} className={containerClass}>
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
          return (() => {
            let hasSeenBody = false;
            const articleItem = item;
            let historyDates: string[] = [];
            let badgeType = "연";
            let badgeColor = "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100";
            let parsedTitle = "";
            
            const safeText = String(articleItem.text || "").trim();
            const datesMatches = safeText.match(/\((?:삭제|개정|신설|전문개정|본조신설)\s*[^)]+\)/g);
            if (datesMatches) {
              datesMatches.forEach(match => {
                const cleaned = match.replace(/[()]/g, '').trim();
                historyDates.push(cleaned);
              });
            }
            if (safeText.includes("<개정")) {
              const match = safeText.match(/<개정(.*?)>/);
              if (match) historyDates.push(`개정 ${match[1].trim()}`);
            }
            badgeType = historyDates.some(h => h.includes("개정")) ? "개" : "연";
            badgeColor = badgeType === "개" ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100" : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100";
            
            if (safeText.startsWith("(") && !/^\((삭제|개정|신설|전문개정|본조신설)/.test(safeText)) {
              const match = safeText.match(/^(\([^)]+\))(.*)/);
              if (match) {
                parsedTitle = match[1];
              }
            }

            return (
              <div className="mt-8 mb-2 flex items-start gap-2 pt-2 relative w-full">
                {isAdmin && (
                  <button 
                    onClick={() => {
                      if (window.confirm("본 수정기능은 규정개정이 아닌 단순오타만 수정이 가능합니다.\n개정이 필요한 경우 입안편집기를 이용하시기 바랍니다.")) {
                        setEditItems(JSON.parse(JSON.stringify(items)));
                        setIsEditing(true);
                        if (articleId) {
                          fetch(`/api/admin/articles/${articleId}`)
                            .then(res => res.json())
                            .then(data => {
                              if (data.history) setEditHistory(data.history);
                            })
                            .catch(err => console.error("History fetch error:", err));
                        }
                      }
                    }}
                    className="w-5 h-5 shrink-0 flex items-center justify-center rounded mt-0.5 cursor-pointer transition-colors bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 hover:text-green-700"
                    title="이 조항 텍스트 바로 수정하기"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                  </button>
                )}
                {!hideHistory && (
                  <button 
                    onClick={() => setModalHistory(historyDates.length > 0 ? historyDates : ["개정 이력이 없습니다."])}
                    className={`w-5 h-5 shrink-0 flex items-center justify-center rounded text-[11px] font-bold mt-0.5 cursor-pointer transition-colors border ${badgeColor}`}
                  >
                    {badgeType}
                  </button>
                )}
                <div className="flex-1 w-full group text-[14.5px] text-slate-800 leading-[1.7]">
                  <div id={`toc-${safeNum}`} className="w-full break-keep mb-1.5 inline-block">
                    <span className="font-bold mr-1 text-[#000080]">{safeNum}{parsedTitle}</span>
                    {safeText.replace(parsedTitle, "").trim() && <span className="font-normal">{renderTextWithHistory(safeText.replace(parsedTitle, "").trim())}</span>}
                  </div>
                </div>
              </div>
            );
          })();
        } else if (item.type === "paragraph") {
          return (
            <div key={index} className="text-slate-800 text-[14.5px] leading-[1.7] mb-1.5 pr-4 break-keep w-full" style={{ paddingLeft: '20px', textIndent: '-20px' }}>
              <span className="font-normal mr-1">{safeNum}</span>
              <span className="font-normal">{renderTextWithHistory(safeText)}</span>
            </div>
          );
        } else if (item.type === "item") {
          const isAddendum = isAddendumItem(safeText);

          return (
            <React.Fragment key={index}>
              <div className="text-slate-800 text-[14.5px] leading-[1.7] mb-1.5 pr-4 break-keep w-full" style={{ paddingLeft: isAddendum ? '20px' : '36px', textIndent: isAddendum ? '-20px' : '-16px' }}>
                <span className="font-normal mr-1">{safeNum}</span>
                <span className="font-normal">{renderTextWithHistory(safeText)}</span>
              </div>
            </React.Fragment>
          );
        } else if (item.type === "subitem") {
          return (
            <div key={index} className="text-slate-800 text-[14.5px] leading-[1.7] mb-1.5 pr-4 break-keep w-full" style={{ paddingLeft: '52px', textIndent: '-16px' }}>
              <span className="font-normal mr-1">{safeNum}</span>
              <span className="font-normal">{renderTextWithHistory(safeText)}</span>
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
                {formatGluedText(safeText, false)}
              </div>
            );
          }
        }
      })}

      {/* HTML 파일이 없는 텍스트 기반 별지 렌더링 (디자인 포맷팅 적용) */}
      {(() => {
        const groups: { title: string, id: string, items: any[] }[] = [];
        let currentGroup: { title: string, id: string, items: any[] } | null = null;

        for (let i = 0; i < textAttachments.length; i++) {
          const item = textAttachments[i];
          const textStr = String(item.text || "").trim();
          const isTitle = /^(?:\[|〔)(별지|별표|서식)/.test(textStr);
          
          if (isTitle) {
            if (currentGroup) groups.push(currentGroup);
            const safeText = textStr.replace(/^〔/, '[').replace(/〕$/, ']');
            currentGroup = { title: safeText, id: `toc-text-attach-${articleNumber}-${i}`, items: [] };
          } else {
            if (!currentGroup) {
               currentGroup = { title: "", id: `toc-text-attach-${articleNumber}-fallback`, items: [] };
            }
            currentGroup.items.push(item);
          }
        }
        if (currentGroup) groups.push(currentGroup);

        return groups.map((g, gIdx) => (
           <div key={`group-${gIdx}`} className="mt-10 mb-12 w-full">
             {g.title && (
               <div id={g.id} className="mb-4 border-t border-slate-300 pt-6 text-left w-full">
                 <span className="text-[17px] font-bold text-[#000080] tracking-tight">{g.title}</span>
               </div>
             )}
             {g.items.length > 0 && (
               <div className="bg-[#fdfdfd] border border-slate-200 rounded-md p-10 shadow-[0_2px_12px_rgba(0,0,0,0.04)] w-full">
                 <div className="flex flex-col gap-2 w-full">
                   {g.items.map((item, i) => {
                      const textStr = String(item.text || "").trim();
                      if (!textStr) return null;
                      
                      let fullTextStr = textStr;
                      if (item.num) {
                        fullTextStr = `${item.num} ${textStr}`;
                      }
                      
                      let itemClass = "text-[15px] leading-[1.8] text-slate-800 break-keep";
                      
                      // 문서 양식 자동 스타일링 휴리스틱
                      if (i === 0 && fullTextStr.length < 30 && !item.num) {
                         itemClass += " text-center font-black text-[22px] tracking-wide mb-10 mt-2";
                      } else if (fullTextStr === "- 다 음 -") {
                         itemClass += " text-center font-bold my-6";
                      } else if (fullTextStr.includes("년") && fullTextStr.includes("월") && fullTextStr.includes("일") && fullTextStr.length < 20) {
                         itemClass += " text-center mt-16 mb-6 tracking-widest text-[16px]";
                      } else if (fullTextStr.includes("(인)") || fullTextStr.includes("서명") || fullTextStr.startsWith("신 청 인") || fullTextStr.startsWith("저작자")) {
                         itemClass += " text-right font-bold text-[16px] pr-8 mb-8";
                      } else if (fullTextStr.includes("총장 귀하") || fullTextStr.includes("총 장 귀 하")) {
                         itemClass += " text-center font-black text-[22px] tracking-widest mt-12 mb-6";
                      } else if (item.type === "item" || item.type === "subitem" || /^\d+\./.test(fullTextStr)) {
                         itemClass += " ml-4 mb-2 text-justify";
                      } else {
                         itemClass += " text-justify mb-2";
                      }

                      return (
                        <div key={`item-${i}`} className={itemClass}>
                          {renderTextWithHistory(fullTextStr)}
                        </div>
                      );
                   })}
                 </div>
               </div>
             )}
           </div>
        ));
      })()}

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

      <Dialog open={isEditing} onClose={() => !isSaving && setIsEditing(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ p: 0 }}>
          <div className="flex justify-between items-center bg-slate-50 border-b border-slate-200 px-4 py-3">
            <span className="font-bold text-[#0c3161] flex items-center gap-2"><svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg> 단순 오타 수정 (인라인 편집)</span>
            <IconButton size="small" onClick={() => !isSaving && setIsEditing(false)} sx={{ p: 0.5 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent className="p-6 bg-slate-50">
          <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] p-3 rounded mb-4 font-bold leading-relaxed shadow-sm">
            ⚠️ 이 기능은 띄어쓰기나 단순 오타 수정에만 사용하십시오. 규정 내용 자체의 개정이 필요할 경우 반드시 [입안편집기]를 통해 개정안을 기안해야 합니다.
          </div>
          <div className="space-y-3 bg-white p-4 border border-slate-200 rounded-lg shadow-inner max-h-[50vh] overflow-y-auto scrollbar">
            {editItems.map((item, idx) => (
              <div key={idx} className="flex gap-3 items-start relative">
                {item.num && <span className="font-bold shrink-0 mt-2.5 text-[#0c3161] whitespace-nowrap min-w-[1.5rem]">{item.num}</span>}
                <textarea
                  className="w-full border border-slate-300 rounded p-2.5 text-[14px] text-slate-800 focus:outline-none focus:border-blue-500 min-h-[60px] resize-y shadow-sm transition-colors focus:bg-blue-50/20 leading-relaxed font-['Pretendard']"
                  value={item.text}
                  onChange={(e) => {
                    const newItems = [...editItems];
                    newItems[idx].text = e.target.value;
                    setEditItems(newItems);
                  }}
                  placeholder="텍스트를 입력하세요"
                />
              </div>
            ))}
          </div>
          {editHistory.length > 0 && (
            <div className="mt-4 bg-slate-100 rounded p-4 border border-slate-200">
              <h4 className="font-bold text-slate-700 text-[13px] mb-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                단순오타수정 과거 이력
              </h4>
              <ul className="space-y-2 max-h-[150px] overflow-y-auto scrollbar">
                {editHistory.map(h => (
                  <li key={h.id} className="text-[12px] bg-white p-2 rounded border border-slate-200 text-slate-600">
                    <div className="text-blue-600 font-bold mb-1">
                      {new Date(h.createdAt).toLocaleString('ko-KR')}
                    </div>
                    <div className="line-clamp-2">
                      (수정 전 본문) {h.beforeText.substring(0, 150)}{h.beforeText.length > 150 ? '...' : ''}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <button
              className="px-4 py-2 border border-slate-300 text-slate-600 bg-white rounded font-bold text-sm hover:bg-slate-50 transition-colors"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              취소
            </button>
            <button
              className="px-4 py-2 bg-[#0c3161] text-white rounded font-bold text-sm hover:bg-blue-800 flex items-center gap-2 transition-colors shadow-sm"
              onClick={async () => {
                if (!articleId) return;
                setIsSaving(true);
                try {
                  const newText = editItems.map(i => {
                    if (i.type === 'article' || i.type === 'text') return i.text;
                    if (i.type === 'paragraph') return i.num ? `${i.num} ${i.text}` : i.text;
                    return `${i.num} ${i.text}`;
                  }).join('\n');
                  const res = await fetch(`/api/admin/articles/${articleId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      contentText: newText,
                      contentJson: editItems
                    })
                  });
                  if (!res.ok) throw new Error('저장 실패');
                  alert('성공적으로 수정되었습니다.');
                  window.location.reload();
                } catch (e) {
                  console.error(e);
                  alert('저장 중 오류가 발생했습니다.');
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
            >
              {isSaving ? "저장 중..." : "수정 완료"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
