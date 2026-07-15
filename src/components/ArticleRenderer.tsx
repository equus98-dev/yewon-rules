import React, { useState, useMemo } from "react";
import { Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { diffWords } from 'diff';
import dynamic from "next/dynamic";

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

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
  contentText?: string;
  contentHtml?: string | null;
  hideHistory?: boolean;
  hasHtmlAttachments?: boolean;
  isAdmin?: boolean;
  trailingTitles?: string[];
  isBundleChild?: boolean;
  seenAddendumCoreTexts?: Set<string>;
  ruleTitle?: string;
  searchKeyword?: string;
  isSelectedForPrint?: boolean;
  onTogglePrintSelect?: (id: string, checked: boolean) => void;
}

const convertCircledNum = (char: string) => {
  const code = char.charCodeAt(0);
  if (code >= 0x2460 && code <= 0x2473) return code - 0x245F;
  if (code >= 0x3251 && code <= 0x325F) return code - 0x3250 + 20;
  return 1;
};

const HISTORY_REGEX = /((?:&lt;|[<(\[＜（])(?:개정|제정|신설|삭제|본조신설|전문개정|전부개정|일부개정|단서신설|후단신설|단서삭제|장\s*변경|조\s*폐지|변경|폐지|표개정|조이동|조신설|항신설|호신설|목신설|표이동|본문이동|캠퍼스명칭변경|명칭변경|서식개정|서식신설|별표개정|별지개정|[가-힣\s,･]+개정|[가-힣\s,･]+신설|[가-힣\s,･]+이동|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?)(?:[^>\])＞）]*\d+[^>\])＞）]*|[\s]*)(?:&gt;|[>\])＞）]))/gi;

const normalizeHistoryDate = (str: string) => {
  let inner = str.replace(/^(?:&lt;|[<(\[＜（])|(?:&gt;|[)>\])＞）])$/g, '').trim();
  let parts = inner.split(',').map(p => p.trim());
  let lastAction = '';
  let normParts = parts.map(part => {
    let match = part.match(/^(개정|제정|신설|삭제|본조신설|전문개정|전부개정|일부개정|단서신설|후단신설|단서삭제|장\s*변경|조\s*폐지|변경|폐지|표개정|조이동|조신설|항신설|호신설|목신설|표이동|본문이동|캠퍼스명칭변경|명칭변경|서식개정|서식신설|별표개정|별지개정|[가-힣\s,･]+개정|[가-힣\s,･]+신설|[가-힣\s,･]+이동)?\s*(.*)$/);
    if (!match) return part;
    let action = match[1];
    let dateStr = match[2];
    
    if (action) {
      lastAction = action;
    } else {
      action = lastAction || '개정';
    }
    
    let dateMatch = dateStr.match(/^([\d.\s]+)(.*)$/);
    let datePart = dateStr;
    let restPart = '';
    if (dateMatch && dateMatch[1].replace(/[^\d]/g, '').length >= 4) {
      datePart = dateMatch[1];
      restPart = dateMatch[2].trim();
    } else {
      dateMatch = null;
    }

    let dateNorm = datePart.replace(/[^\d.]/g, '').split('.').map(s => s.trim()).filter(s => s.length > 0).map(s => parseInt(s, 10)).join('. ');
    if (dateNorm) dateNorm += '.';
    else dateNorm = datePart.trim();
    
    let result = action + (dateNorm ? ' ' + dateNorm : '');
    if (restPart) result += ' ' + restPart;
    return result.trim();
  });
  return '<' + normParts.join(', ') + '>';
};

const mergeConsecutiveHistories = (text: string) => {
  if (!text) return text;
  let prev = "";
  let cur = text;
  const mergePattern = /((?:&lt;|[<(\[＜（])(?:개정|제정|신설|삭제|본조신설|전문개정|전부개정|일부개정|단서신설|후단신설|단서삭제|장\s*변경|조\s*폐지|변경|폐지|표개정|조이동|조신설|항신설|호신설|목신설|표이동|본문이동|캠퍼스명칭변경|명칭변경|서식개정|서식신설|별표개정|별지개정|[가-힣\s,･]+개정|[가-힣\s,･]+신설|[가-힣\s,･]+이동|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?)[^>\])＞）]*?)(?:&gt;|[>\])＞）])\s*[,･]?\s*(?:&lt;|[<(\[＜（])((?:개정|제정|신설|삭제|본조신설|전문개정|전부개정|일부개정|단서신설|후단신설|단서삭제|장\s*변경|조\s*폐지|변경|폐지|표개정|조이동|조신설|항신설|호신설|목신설|표이동|본문이동|캠퍼스명칭변경|명칭변경|서식개정|서식신설|별표개정|별지개정|[가-힣\s,･]+개정|[가-힣\s,･]+신설|[가-힣\s,･]+이동|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?)[^>\])＞）]*?(?:&gt;|[>\])＞）]))/gi;
  
  while (cur !== prev) {
    prev = cur;
    cur = cur.replace(mergePattern, "$1, $2");
  }
  return cur;
};

export default function ArticleRenderer({
  id,
  articleId,
  chapter,
  section,
  title = "",
  articleNumber,
  contentJson,
  contentText,
  contentHtml,
  hideHistory = false,
  hasHtmlAttachments = true,
  isAdmin = false,
  trailingTitles = [],
  isBundleChild = false,
  seenAddendumCoreTexts,
  ruleTitle = "",
  searchKeyword = "",
  isSelectedForPrint = false,
  onTogglePrintSelect,
}: ArticleRendererProps) {
  // DB에서 넘어온 값에 하드코딩된 span 껍데기(과거 버그)가 묻어있을 수 있으므로 정리합니다.
  if (title) title = title.replace(/<span class=["']?text-sky-700[^>]*>([\s\S]*?)<\/span>/gi, '$1');
  if (contentText) contentText = contentText.replace(/<span class=["']?text-sky-700[^>]*>([\s\S]*?)<\/span>/gi, '$1');
  if (contentHtml) contentHtml = contentHtml.replace(/<span class=["']?text-sky-700[^>]*>([\s\S]*?)<\/span>/gi, '$1');
  if (typeof contentJson === 'string') contentJson = contentJson.replace(/<span class=["']?text-sky-700[^>]*>([\s\S]*?)<\/span>/gi, '$1');
  const isAddendumArticle =
    title === "부칙" ||
    title === "부" ||
    title === "칙" ||
    (title || "").replace(/\s+/g, "").startsWith("부칙") ||
    chapter === "부칙" ||
    (chapter || "").replace(/\s+/g, "").startsWith("부칙") ||
    // title/chapter가 없어도 contentText가 부칙으로 시작하는 경우 (예: 1-0-1 정관)
    (!title && !chapter && /^부\s*칙/.test((contentText || "").trim()));

  const handlePrintArticle = (specificContentText?: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // 인쇄용 내용 구성
    const ruleName = ruleTitle || "규정명 미상";
    const chapterName = chapter ? chapter : "";
    
    // 출력할 조문 내용 결정
    let rawText = "";
    if (contentHtml && contentHtml.trim().length > 0) {
      rawText = contentHtml;
    } else if (specificContentText) {
      rawText = specificContentText;
    } else if (contentText) {
      rawText = contentText;
    } else {
      rawText = title || `제${articleNumber}조`;
    }

    // 🚨 [Table Foster Parenting 방지]: <table> 내부의 \n을 사전에 모조리 제거하여 표 위로 거대한 공백이 생기는 버그 완벽 해결
    if (/<table/i.test(rawText)) {
      rawText = rawText.replace(/<table[\s\S]*?<\/table>/gi, (tableMatch) => {
        return tableMatch.replace(/\n/g, '');
      });
    }

    // 인쇄 화면에서 표 위아래로 불필요한 공백 태그나 다량의 br 태그 제거
    let bodyHtml = rawText.replace(/\n/g, "<br/>");
    bodyHtml = bodyHtml.replace(/(?:<br\s*\/?>|\s|&nbsp;)+<table/gi, '<table');
    bodyHtml = bodyHtml.replace(/<\/table>(?:<br\s*\/?>|\s|&nbsp;)+/gi, '</table>');

    const isOrgChart = title.includes("조직도") || title.includes("기구표") || bodyHtml.includes("조직도");
    const wrapperClass = isOrgChart ? "org-chart-wrapper" : "html-table-wrapper";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${ruleName} - 조문 인쇄</title>
          <style>
            @media print {
              body { font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; color: #000; padding: 20px; line-height: 1.6; }
              .rule-title { font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .chapter-title { font-size: 18px; font-weight: bold; color: #000080; margin-bottom: 15px; }
              .article-content { font-size: 16px; margin-top: 10px; }
              .btn-print { display: none; }
              /* 프린트 시 표 스타일 */
              .html-table-wrapper table { border-collapse: collapse !important; width: 100% !important; margin: 15px 0 !important; font-size: 11pt !important; background-color: white !important; }
              .html-table-wrapper th, .html-table-wrapper td { border: 1px solid #aaa !important; padding: 8px 12px !important; color: #000 !important; vertical-align: middle !important; word-break: break-word !important; }
              .html-table-wrapper th { background-color: #eee !important; font-weight: bold !important; text-align: center !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .html-table-wrapper tr:first-child td { background-color: #eee !important; font-weight: bold !important; text-align: center !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            body { font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; color: #333; padding: 40px; max-width: 900px; margin: 0 auto; line-height: 1.6; }
            .rule-title { font-size: 26px; font-weight: bold; text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; color: #0c3161; }
            .chapter-title { font-size: 18px; font-weight: bold; color: #000080; margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 8px; }
            .article-content { font-size: 16px; margin-top: 10px; }
            .btn-print { display: block; width: 120px; margin: 0 auto 30px auto; padding: 10px; text-align: center; background: #0c3161; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; }

            /* 웹 팝업 창 표(Table) 프리미엄 스타일 */
            .html-table-wrapper { width: 100%; overflow-x: auto; padding: 10px 0; }
            .html-table-wrapper table { border-collapse: collapse !important; width: 100% !important; margin: 20px 0 !important; font-size: 14px !important; background-color: white !important; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .html-table-wrapper th, .html-table-wrapper td { border: 1px solid #e2e8f0 !important; padding: 12px 16px !important; color: #334155 !important; vertical-align: middle !important; word-break: break-word !important; }
            .html-table-wrapper th { background-color: #f3f4f6 !important; font-weight: 700 !important; color: #0f172a !important; text-align: center !important; }
            .html-table-wrapper tr:first-child td { background-color: #e5e7eb !important; font-weight: 700 !important; color: #0f172a !important; text-align: center !important; }

            /* 조직도 전용 스타일 */
            .org-chart-wrapper { width: 100%; overflow-x: auto; padding: 20px 0; }
            .org-chart-wrapper table { width: 100% !important; max-width: 1000px; margin: 0 auto !important; border-collapse: collapse !important; table-layout: fixed !important; background-color: transparent !important; }
            .org-chart-wrapper td, .org-chart-wrapper th { padding: 0 !important; font-family: 'Malgun Gothic', sans-serif !important; vertical-align: middle !important; }
            .org-chart-wrapper td[style*="border-left: #000000 0.425250pt solid"][style*="border-right: #000000 0.425250pt solid"] { background-color: #ffffff !important; border-radius: 4px; }
          </style>
        </head>
        <body>
          <button class="btn-print" onclick="window.print()">인쇄하기</button>
          <div class="rule-title">${ruleName}</div>
          ${chapterName ? `<div class="chapter-title">${chapterName}</div>` : ""}
          <div class="article-content ${wrapperClass}">${bodyHtml}</div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const hideBadge = hideHistory || isAddendumArticle;
  const [modalHistory, setModalHistory] = useState<any[] | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editItems, setEditItems] = useState<ContentItem[]>([]);
  const [editHtml, setEditHtml] = useState<string | null>(null);
  const [originalHasHtml] = useState(!!(contentHtml && contentHtml.trim().length > 0));
  const [isSaving, setIsSaving] = useState(false);
  const [editHistory, setEditHistory] = useState<{ id: string, createdAt: string, beforeText: string }[]>([]);

  const joditConfig = useMemo(() => ({
    readonly: false,
    placeholder: "내용을 입력하세요",
    height: 500,
    style: {
      fontFamily: 'Pretendard'
    },
    toolbarButtonSize: "small" as const,
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: "insert_as_html" as any
  }), []);

  const renderEditButton = (isItemRelative = false) => {
    if (!isAdmin) return null;
    if (isAddendumArticle) return null;
    return (
      <button 
        onClick={() => {
          if (window.confirm("본 수정기능은 규정개정이 아닌 단순오타만 수정이 가능합니다.\n개정이 필요한 경우 입안편집기를 이용하시기 바랍니다.")) {
            if (contentHtml && contentHtml.trim().length > 0) {
              setEditHtml(contentHtml);
            } else {
              const htmlStr = items.map((i: any) => {
                const text = i.text || "";
                if (!i.num) return `<p>${text}</p>`;
                if (text.trim().startsWith(i.num)) return `<p>${text}</p>`;
                return `<p>${i.num} ${text}</p>`;
              }).join('');
              setEditHtml(htmlStr);
            }
            setEditItems([]);
            setIsEditing(true);
            if (articleId) {
              fetch(`/api/admin/articles/${articleId}`)
                .then(res => res.json() as any)
                .then(data => {
                  if (data.history) setEditHistory(data.history);
                })
                .catch(err => console.error("History fetch error:", err));
            }
          }
        }}
        className={`absolute -left-8 ${isItemRelative ? 'top-0' : 'top-5'} w-6 h-6 shrink-0 flex items-center justify-center rounded mt-0.5 cursor-pointer transition-colors bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 hover:text-green-700 z-10`}
        title="이 조항 텍스트 바로 수정하기"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
      </button>
    );
  };

  const handleOpenHistory = async (dates: string[]) => {
    if (!articleId) {
      setModalHistory(dates.length > 0 ? dates.map(d => ({ isSimpleString: true, text: d })) : [{ isSimpleString: true, text: "개정 이력이 없습니다." }]);
      return;
    }

    setIsLoadingHistory(true);
    setModalHistory([]); // open modal with loading state
    try {
      const res = await fetch(`/api/articles/${articleId}/history`);
      const data = (await res.json()) as any;
      if (data.history && data.history.length > 0) {
        setModalHistory(data.history);
      } else {
        setModalHistory(dates.length > 0 ? dates.map(d => ({ isSimpleString: true, text: d })) : [{ isSimpleString: true, text: "개정 이력이 없습니다." }]);
      }
    } catch (e) {
      setModalHistory(dates.length > 0 ? dates.map(d => ({ isSimpleString: true, text: d })) : [{ isSimpleString: true, text: "개정 이력을 불러오지 못했습니다." }]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  if (contentHtml && contentHtml.trim().length > 0) {
    // 제목이나 내용에 조직도/기구표가 있으면 인라인 스타일을 우선하는 org-chart-wrapper 적용
    const isOrgChart = title.includes("조직도") || title.includes("기구표") || contentHtml.includes("조직도");
    const wrapperClass = isOrgChart ? "org-chart-wrapper" : "html-table-wrapper";

    let cleanHtml = contentHtml;
    cleanHtml = mergeConsecutiveHistories(cleanHtml);

    // 조문 제목 바로 옆에 <개정 ...>이 있고 바로 뒤이어 ①항이 나오는 경우 조문 제목 옆의 <개정 ...>을 일괄 제거
    cleanHtml = cleanHtml.replace(/^(제\d+조(?:의\d+)?\s*(?:\([^)]*\)|\[[^\]]*\]|〔[^〕]*〕|（[^）]*）)?)\s*([<(\[＜（]\s*개정[^>\])＞）]*[>\])＞）])\s*(?=[①])/gi, (match, titlePart) => {
      return titlePart + " ";
    });

    if (hideHistory) {
      cleanHtml = cleanHtml.replace(HISTORY_REGEX, "");
    } else {
      cleanHtml = cleanHtml.replace(
        HISTORY_REGEX,
        (match) => `<span class="text-sky-700 font-medium text-[13px] ml-1">${normalizeHistoryDate(match).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`
      );
    }

    // 특정 규정(학생생활관 등) 제12조 표 내의 빨간글씨 제거 요청 반영
    if (articleNumber === 12) {
      cleanHtml = cleanHtml.replace(/color:\s*(?:#ff0000|red|#FF0000);?/gi, '');
      cleanHtml = cleanHtml.replace(/color=["']?(?:#ff0000|red|#FF0000)["']?/gi, '');
    }

    // 1. 중첩된 빈 태그(여백) 모두 제거 (중간 간격 문제 해결)
    // HWP 변환기는 <p><span>&nbsp;</span></p> 형태의 빈 문단을 다수 생성하여 조문 사이를 비정상적으로 벌어지게 함.
    let prevHtml = '';
    while (cleanHtml !== prevHtml) {
      prevHtml = cleanHtml;
      cleanHtml = cleanHtml.replace(/<(p|div|span|h[1-6])(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi, (match, tag, inner) => {
        const strippedInner = inner.replace(/<[^>]+>/g, '').replace(/\s|&nbsp;/gi, '');
        if (strippedInner === '') return ''; 
        return match;
      });
    }

    // 2. 앞뒤에 남은 단순 공백 및 <br> 제거
    cleanHtml = cleanHtml.replace(/^(?:\s|&nbsp;|<br\s*\/?>)+/gi, '');
    cleanHtml = cleanHtml.replace(/(?:\s|&nbsp;|<br\s*\/?>)+$/gi, '');

    // 3. HTML 태그의 인라인 스타일 중 불필요한 위아래 여백(margin) 제거
    cleanHtml = cleanHtml.replace(/style="([^"]*)"/gi, (match, styleContent) => {
      let newStyle = styleContent.replace(/margin-top\s*:\s*[^;]+;?/gi, '');
      newStyle = newStyle.replace(/margin-bottom\s*:\s*[^;]+;?/gi, '');
      newStyle = newStyle.replace(/margin\s*:\s*[^;]+;?/gi, '');
      if (newStyle.trim() === '') return '';
      return `style="${newStyle}"`;
    });

    // 4. HTML 본문 앞에 중복 포함된 현재 장/절 제목 제거
    if (chapter || section) {
      let chapterRemoved = false;
      let sectionRemoved = false;
      let foundRealText = false;

      cleanHtml = cleanHtml.replace(/<(p|h[1-6])(?:\s[^>]*?)?>([\s\S]*?)<\/\1>/gi, (match, tag, innerHtml) => {
        if (foundRealText) return match;
        
        const rawText = innerHtml.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        const pText = rawText.replace(/\s+/g, '').replace(/&nbsp;/g, '');
        
        if (pText === '') return ''; 
        
        if (chapter && !chapterRemoved) {
          const chapText = chapter.replace(/\s+/g, '');
          if (pText === chapText || (pText.includes(chapText) && pText.length < chapText.length + 5)) {
            chapterRemoved = true;
            return ''; 
          }
        }
        
        if (section && !sectionRemoved) {
          const secText = section.replace(/\s+/g, '');
          if (pText === secText || (pText.includes(secText) && pText.length < secText.length + 5)) {
            sectionRemoved = true;
            return ''; 
          }
        }
        
        foundRealText = true; 
        return match;
      });
    }

    // 5. 명시적으로 전달받은 다음 장/절 제목이 HTML 끝에 딸려있는 경우 (문장 구조를 파괴하지 않고 텍스트만 제거)
    if (cleanHtml && trailingTitles.length > 0) {
      trailingTitles.slice().reverse().forEach(title => {
        if (!title) return;
        const chars = title.replace(/\s+/g, '').split('');
        const regexStr = chars.map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(?:\\s|&nbsp;|<[^>]+>)*');
        // 뒤에 알 수 없는 찌꺼기 태그가 최대 60자까지 붙어있어도 감지하도록 허용
        const chapRegex = new RegExp(`((?:\\s|&nbsp;|<[^>]+>)*${regexStr}(?:\\s|&nbsp;|<[^>]+>)*)([\\s\\S]{0,60})$`, 'i');
        cleanHtml = cleanHtml.replace(chapRegex, (match, titleMatch, trailingGarbage) => {
          // trailingGarbage에 실제 의미있는 텍스트가 5자 이상 포함되어 있다면, 엉뚱한 문장을 잘못 매칭한 것일 수 있으므로 취소
          const garbageText = trailingGarbage.replace(/<[^>]+>/g, '').replace(/\s|&nbsp;/gi, '');
          if (garbageText.length > 5) return match;

          const strippedTitle = titleMatch.replace(/>([^<]+)</g, (m: string, textContent: string) => {
            return textContent.trim() === '' ? m : '><';
          }).replace(/^([^<]+)</, '<').replace(/>([^<]+)$/, '>');
          return strippedTitle + trailingGarbage;
        });
      });
    }

    // 6. 부칙 등에 딸려온 별지/별표 HTML 통째로 잘라내기
    if (articleNumber < 9000 && title.includes('부칙') && cleanHtml) {
       const formMatch = cleanHtml.match(/[\[〔【<「『]\s*(별지|별표|서식|별첨)/i);
       if (formMatch && formMatch.index !== undefined) {
          cleanHtml = cleanHtml.substring(0, formMatch.index);
       }
    }
    
    // 🚨 하드코딩 강제 삭제 킬스위치 (부칙 인식 실패 시에도 무조건 동작하도록 조건 밖으로 분리)
    if (cleanHtml) {
       const hardcodeMatchHtml = cleanHtml.match(/「(?:<[^>]+>|\s|&nbsp;)*별(?:<[^>]+>|\s|&nbsp;)*표(?:<[^>]+>|\s|&nbsp;)*1(?:<[^>]+>|\s|&nbsp;)*」(?:<[^>]+>|\s|&nbsp;)*법(?:<[^>]+>|\s|&nbsp;)*인(?:<[^>]+>|\s|&nbsp;)*직(?:<[^>]+>|\s|&nbsp;)*원/);
       if (hardcodeMatchHtml && hardcodeMatchHtml.index !== undefined) {
          cleanHtml = cleanHtml.substring(0, hardcodeMatchHtml.index);
       }
    }

    if (articleNumber >= 9000) {
      // HWP 파싱 중 HTML 자체에 별지 제목이 중복 포함된 경우 이를 제거 (첫 번째 P 태그가 제목인 경우)
      const match = cleanHtml.match(/^(\s*<p[^>]*>.*?<\/p>\s*)/i);
      if (match) {
        const pText = match[0].replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
        if (/^(?:\[|〔)(별지|별표|서식|별첨)/.test(pText)) {
          cleanHtml = cleanHtml.replace(match[0], '');
        }
      }
    }

    if (cleanHtml) {
      cleanHtml = cleanHtml.replace(/(\s|>|&nbsp;|<br\s*\/?>)(\d{1,2}(?:의\d+)?\.)\s*(?=[^\d])/g, (match, p1, p2, offset, str) => {
        const before = str.slice(0, offset + p1.length);
        if (before.match(/(?:<br\s*\/?>|<\/p>|<p>|<div[^>]*>|<td[^>]*>|<th[^>]*>|<li[^>]*>)\s*$/i)) return match;
        if (before.match(/(?:^|\n)\s*$/)) return match;
        // 인용구 생략
        if (before.match(/(?:제|전|\(|,|및|또는|와|과|이나|나|에|의|구분은|경우에|때에는|\(거\))\s*$/)) return match;
        // 날짜 내부 생략
        if (before.match(/\d+(?:의\d+)?\.\s*$/)) return match;
        // < > 내부 방지 (p1이 > 이면 태그 바깥이므로 예외)
        if (p1 !== '>') {
            const openAngles = (before.match(/</g) || []).length;
            const closeAngles = (before.match(/>/g) || []).length;
            if (openAngles > closeAngles) return match;
        }
        
        return p1 + '<br/>' + p2 + ' ';
      });

      // 1. Addendum Keywords: Break unconditionally only in Addendum Articles
      cleanHtml = cleanHtml.replace(/(\([^)]*(?:시행일|경과조치|적용례|적용범위|준용|폐지|예외|단서|특례|임기|존속기간|관련|시행|적용)[^)]*\))/g, (match, paren, offset, str) => {
        const before = str.slice(0, offset);
        if (before.match(/(?:<br\s*\/?>|<\/p>|<p>)\s*$/i)) return match;
        if (before.match(/\d+(?:의\d+)?\.\s*$/)) return match;
        if (before.match(/제\d+조의?\d*\s*$/)) return match;
        if (before.match(/\d\s*$/)) return match;
        
        if (!isAddendumArticle) return match;
        
        return '<br/>' + match;
      });

      // 1-5. Hangs (①~⑳) should start on a new line if they are glued to previous text
      cleanHtml = cleanHtml.replace(/([①-⑳])/g, (match, p1, offset, str) => {
        const before = str.slice(0, offset);
        if (before.match(/(?:<br\s*\/?>|<\/p>|<p>|<div[^>]*>|<td[^>]*>|<th[^>]*>|<li[^>]*>)\s*$/i)) return match;
        if (before.match(/(?:^|\n)\s*$/)) return match;
        // 인용구인 경우 (예: 제①항, 제1항 및 ②항) 줄바꿈 생략
        if (/(?:제|전|\(|,|및|또는|와|과|이나|나|에|의|구분은|경우에|때에는|\(거\))\s*$/.test(before)) return match;
        // 조문 제목 바로 뒤에 나오는 ① 등은 줄바꿈하지 않음
        if (before.match(/^(?:<[^>]+>)*(?:제\d+조(?:의\d+)?(?:<[^>]+>)*\s*)?(?:\[[^\]]*\]|〔[^〕]*〕|\([^)]*\)|（[^）]*）)?\s*(?:<[^>]+>)*\s*(?:[<(\[＜（][^>\])＞）]*[>\])＞）]\s*)*(?:<span[^>]*>[\s\S]*?<\/span>\s*)*$/)) return match;
        return '<br/>' + match;
      });

      // 2. Normal Parentheses: Break only if boundary conditions are met, or if it is an Addendum Article
      cleanHtml = cleanHtml.replace(/(\((?:<[^>]+>)*[가-힣A-Za-z0-9\s·,\u200B-\u200D\uFEFF]{2,}[^)]*\))/g, (match, paren, offset, str) => {
        const before = str.slice(0, offset);
        if (before.match(/(?:<br\s*\/?>|<\/p>|<p>)\s*$/i)) return match;
        if (before.match(/\d+(?:의\d+)?\.\s*$/)) return match;
        if (before.match(/제\d+조의?\d*\s*$/)) return match;
        if (before.match(/\d\s*$/)) return match;

        if (isAddendumArticle) {
          return '<br/>' + match;
        }

        if (!before.match(/(?:^|[.\s>\]]|&nbsp;)$/i)) return match;
        return '<br/>' + match;
      });
    }

    if (cleanHtml && isAddendumArticle) {
      // 부칙 제목을 다른 규정들처럼 굵게 표시 (contentHtml에 직접 <p>부칙</p>이 들어있는 경우)
      cleanHtml = cleanHtml.replace(/<p>(\s*부\s*칙\s*)<\/p>/i, '<p class="font-bold text-[16px]">$1</p>');
    }

    if (cleanHtml && searchKeyword && searchKeyword.trim().length > 0) {
      const keyword = searchKeyword.trim();
      const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![^<]*>)`, 'gi');
      cleanHtml = cleanHtml.replace(regex, `<mark class="highlight-mark bg-yellow-300 font-bold px-1 rounded shadow-sm">$1</mark>`);
    }

    return (
      <div id={id} className="animate-fade-in rule-viewer-content font-['Pretendard'] w-full relative group">
        {renderEditButton()}
        {articleNumber >= 9000 && (
          <div className="mt-16 mb-8 border-t-2 border-slate-300 pt-10 text-left w-full">
            <span className="text-[20px] font-black text-[#000080] tracking-tight">{["부", "부 ", "칙", "칙 "].includes(title) ? "부칙" : title}</span>
          </div>
        )}
        <div className={`mb-4 ql-editor ${wrapperClass} px-0 py-2 w-full`}>
            {formatGluedText(cleanHtml, true)}
        </div>
        {renderDialogs()}
      </div>
    );
  }

  let items: ContentItem[] = [];
  try {
    let parsed = contentJson;
    if (typeof contentJson === "string") {
      if (contentJson.includes("[object Object]")) {
        throw new Error("Invalid contentJson");
      }
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
    console.error("Failed to parse contentJson, falling back to contentText");
  }

  if (!Array.isArray(items) || items.length === 0) {
    if (contentText) {
      items = [{ type: "text", num: "", text: contentText }];
    } else {
      items = [];
    }
  }

  // Handle glued documents where the title contains the first article but content doesn't
  const hasArticleItem = items.some(i => i && i.type === "article");
  if (!hasArticleItem && title && articleNumber < 9000) {
    const expectedTitleStart = `제${articleNumber}조`;
    let fullTitle = /^제\d+조/.test(title.trim()) ? title : `${expectedTitleStart}(${title})`;
    if (articleNumber >= 8000 && articleNumber < 9000) {
      fullTitle = title.trim();
    }
    
    // Check if the first paragraph already contains the article number or title
    let alreadyHasTitle = false;
    const cleanExpected = expectedTitleStart.replace(/\s+/g, '');
    const cleanFull = fullTitle.replace(/\s+/g, '');
    for (let i = 0; i < Math.min(items.length, 3); i++) {
        if (items[i]) {
            const rawTextStr = String(items[i].text || "");
            const textStr = rawTextStr.trim();
            const cleanTextStr = rawTextStr.replace(/<[^>]+>/g, '').replace(/\s+/g, '');
            if (textStr.startsWith(expectedTitleStart) || cleanTextStr.startsWith(cleanExpected) || (articleNumber >= 8000 && cleanTextStr.startsWith(cleanFull))) {
                alreadyHasTitle = true;
                break;
            }
        }
    }
    
    if (!alreadyHasTitle) {
      let targetIndex = -1;
      for (let i = 0; i < Math.min(items.length, 3); i++) {
        const text = String(items[i]?.text || "").trim();
        if (text && !/^[\[〔]?(?:시행|제정|개정)/.test(text) && !text.includes("담당부서")) {
          targetIndex = i;
          break;
        }
      }
      
      if (targetIndex !== -1 && items[targetIndex]) {
        let originalText = String(items[targetIndex].text || "").trim();
        if (articleNumber >= 8000 && articleNumber < 9000) {
           originalText = originalText.replace(/^(?:부\s*칙\s*)+/, '');
        }
        items[targetIndex].text = `${fullTitle}\n${originalText}`;
      } else {
        if (!alreadyHasTitle) {
          items[0] = { ...items[0], num: fullTitle };
        }
      }
    }
  }

  // 제1조, 제3조 등이 일반 text나 paragraph로 잘못 분류되어 조문 제목 및 연/인 버튼 인식이 안 되는 문제 완벽 해결
  let foundArticleNum = "";
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item && (item.type === "text" || item.type === "paragraph")) {
      const textStr = String(item.text || "").replace(/<[^>]+>/g, '').trim();
      const numStr = String(item.num || "").trim();
      if (/^제\d+조/.test(textStr) || /^제\d+조/.test(numStr)) {
        const currentNum = numStr.match(/^제\d+조(?:의\d+)?/)?.[0] || textStr.match(/^제\d+조(?:의\d+)?/)?.[0] || "";
        // 이미 같은 조항 번호를 가진 article이 앞서 인식되었다면, 중복 승격을 방지하여 [연][인] 배지가 두 번 나오는 현상을 차단한다.
        if (currentNum && foundArticleNum === currentNum) {
           continue; 
        }
        item.type = "article";
        if (!item.num && currentNum) {
          item.num = currentNum;
        }
        if (currentNum) foundArticleNum = currentNum;
      }
    } else if (item && item.type === "article") {
      const currentNum = String(item.num || "").match(/^제\d+조(?:의\d+)?/)?.[0] || String(item.text || "").match(/^제\d+조(?:의\d+)?/)?.[0] || "";
      if (currentNum) foundArticleNum = currentNum;
    }
  }

  // --- Normalization: Glue detached first paragraph to article text ---
  const normalizedItems: ContentItem[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item && item.type === "article") {
       let articleText = String(item.text || "").replace(/<[^>]+>/g, '').trim();
       let articleTitle = "";
       const parts = item.num ? (item.num.match(/^(제\d+조(?:의\d+)?)\s*(.*)/) || ["", item.num, ""]) : ["", "", ""];
       if (parts[2]) {
         articleTitle = parts[2].trim();
       }
       
       if (articleTitle) {
           if (articleText.startsWith(articleTitle)) {
               articleText = articleText.substring(articleTitle.length).trim();
           } else if (articleText.startsWith(`(${articleTitle})`)) {
               articleText = articleText.substring(articleTitle.length + 2).trim();
           } else if (articleText.startsWith(`[${articleTitle}]`)) {
               articleText = articleText.substring(articleTitle.length + 2).trim();
           }
       } else if (articleText.startsWith("(")) {
           // If title is in the text itself like "(편제)"
           const match = articleText.match(/^(\([^)]+\))(.*)/);
           if (match) {
               articleText = match[2].trim();
           }
       }
       
       if (!articleText && i + 1 < items.length) {
           const nextItem = items[i + 1];
           if (nextItem && (nextItem.type === "paragraph" || nextItem.type === "text")) {
               const nextTextPlain = String(nextItem.text || "").replace(/<[^>]+>/g, '').trim();
               const nextNumPlain = String(nextItem.num || "").trim();
               if (/^[①-⑳]/.test(nextTextPlain) || /^[①-⑳]/.test(nextNumPlain) || (!/^\d{1,2}(?:의\d+)?\./.test(nextTextPlain) && !/^[가-하]\./.test(nextTextPlain))) {
                   item.text = (item.text || "") + " " + (nextItem.num ? nextItem.num + " " : "") + (nextItem.text || "");
                   normalizedItems.push(item);
                   i++; // Skip the next item
                   continue;
               }
           }
       }
    }
    normalizedItems.push(item);
  }
  items = normalizedItems;



  let textAttachments: ContentItem[] = [];

  const attachmentStartIndex = items.findIndex((item) => {
    if (!item || !item.text) return false;
    const textStr = String(item.text).trim();
    return /^(?:\[|〔)(별지|별표|서식|별첨)/.test(textStr);
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

  // 본문 맨 앞의 일반 텍스트에 장/절 이름이 포함된 경우 formatGluedText가 검은색 일반 텍스트로 중복 렌더링하는 것을 방지
  if (chapter || section) {
    for (let i = 0; i < Math.min(items.length, 3); i++) {
      if (items[i] && (items[i].type === "text" || items[i].type === "paragraph" || items[i].type === "article")) {
        let text = String(items[i].text || "").trim();
        let changed = false;

        if (chapter) {
          const chapterNumMatch = chapter.match(/^(제\d+장)/);
          if (chapterNumMatch) {
            const cRegex = new RegExp(`^\\s*${chapterNumMatch[1]}[^\\n제]*\\s*`, 'm');
            if (cRegex.test(text)) {
               text = text.replace(cRegex, '').trim();
               changed = true;
            }
          }
        }
        if (section) {
          const sectionNumMatch = section.match(/^(제\d+절)/);
          if (sectionNumMatch) {
            const sRegex = new RegExp(`^\\s*${sectionNumMatch[1]}[^\\n제]*\\s*`, 'm');
            if (sRegex.test(text)) {
               text = text.replace(sRegex, '').trim();
               changed = true;
            }
          }
        }
        
        if (changed) {
          items[i].text = text;
        }
      }
    }
  }

  let hasSeenBody = false;
  let addendumStarted = false;

  const isAddendumItem = (text: string) =>
    /^\(시행일\)|^\(폐지|^\(적용예외|^\(경과조치|^\(적용범위|^\(준용\)/.test(text.trim());

  function renderTextWithHistory(text: string) {
    // DB에 &lt;table&gt; 과 같이 이스케이프되어 저장된 경우를 대비해 디코딩
    let decodedText = text
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&nbsp;/g, " ")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/설치.{0,2}운영.{0,2}폐지/gu, '설치·운영·폐지');

    // DB에 잘못 저장된 연혁 span 태그가 있다면 껍데기를 벗겨냅니다. (리액트가 그대로 문자로 렌더링하는 버그 방지)
    decodedText = decodedText.replace(/<span class=["']?text-sky-700[^>]*>([\s\S]*?)<\/span>/gi, '$1');

    decodedText = mergeConsecutiveHistories(decodedText);

    // 조문 제목 바로 옆에 <개정 ...>이 있고 바로 뒤이어 ①항이 나오는 경우 조문 제목 옆의 <개정 ...>을 일괄 제거
    decodedText = decodedText.replace(/^(제\d+조(?:의\d+)?\s*(?:\([^)]*\)|\[[^\]]*\]|〔[^〕]*〕|（[^）]*）)?)\s*([<(\[＜（]\s*개정[^>\])＞）]*[>\])＞）])\s*(?=[①])/gi, (match, titlePart) => {
      return titlePart + " ";
    });

    // 만약 테이블 태그가 없고 단순히 <p>나 </p> 등의 태그만 텍스트로 들어가 있다면 이를 정화해줍니다.
    if (!/<table/i.test(decodedText)) {
      decodedText = decodedText.replace(/<\/?[pP](?:\s[^>]*)?>/g, "");
    }

    if (hideHistory) {
      // 연혁 숨기기
      decodedText = decodedText.replace(HISTORY_REGEX, "");
    }

    // 🚨 [핵심 버그 수정: Table Foster Parenting 방지]
    // <table> 내부의 \n이 <br/>로 변환되면 브라우저가 이를 테이블 위로 몽땅 끄집어내어 거대한 여백(수백 개의 br)을 만듦!
    // 따라서 <table> 태그 내부의 \n을 사전에 모조리 제거!
    if (/<table/i.test(decodedText)) {
      decodedText = decodedText.replace(/<table[\s\S]*?<\/table>/gi, (tableMatch) => {
        return tableMatch.replace(/\n/g, '');
      });
    }
    
    // 연혁 표시: <개정 ...> 부분을 파란색으로 렌더링하기 위한 문자열 준비
    let htmlText = decodedText.replace(
      HISTORY_REGEX,
      (match) => `<span class="text-sky-700 font-medium text-[13px] ml-1">${normalizeHistoryDate(match).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`
    );

    // HTML에서 \n은 공백으로 처리되어 줄바꿈이 사라지므로, <br/>로 변환
    htmlText = htmlText.replace(/\n/g, '<br/>');
    htmlText = htmlText.replace(/④\s*항은\s*(?:<br\s*\/?>)+\s*①/g, '④ 항은 ①');

    // 1-5. Hangs (①~⑳) should start on a new line if they are glued to previous text
    htmlText = htmlText.replace(/([①-⑳])/g, (match, p1, offset, str) => {
      if (offset === 0) return match;
      const before = str.slice(0, offset);
      // 조문 제목 바로 뒤에 나오는 ① 등은 줄바꿈하지 않음
      if (before.match(/^(?:<[^>]+>)*(?:제\d+조(?:의\d+)?(?:<[^>]+>)*\s*)?(?:\[[^\]]*\]|〔[^〕]*〕|\([^)]*\)|（[^）]*）)?\s*(?:<[^>]+>)*\s*(?:[<(\[＜（][^>\])＞）]*[>\])＞）]\s*)*(?:<span[^>]*>[\s\S]*?<\/span>\s*)*$/)) return match;
      // 인용구인 경우 (예: 제①항, 제1항 및 ②항) 줄바꿈 생략
      if (/(?:제|전|\(|,|및|또는|와|과|이나|나|에|의|구분은|경우에|때에는|\(거\))\s*$/.test(before)) return match;
      // 제규정 관리 규정 제5조 예외 처리 (④, ⑤ 본문 내의 기호 설명 부분)
      if (str.includes("①, ②, 호는") || str.includes("호는 1, 2") || str.includes("목은 가, 나")) return match;
      const recentBefore = before.slice(-50);
      if ((recentBefore.includes("④ 항은") || recentBefore.includes("부칙 조항의 표시는") || recentBefore.includes("연장 표시하지")) && p1 !== '④' && p1 !== '⑤') {
        return match;
      }
      // <br/>, </p>, <p> 등 블록 요소 뒤에는 이미 줄바꿈이 있으므로 추가하지 않음
      if (before.match(/(?:<br\s*\/?>|<\/p>|<p>|<div[^>]*>|<td[^>]*>|<th[^>]*>|<li[^>]*>)\s*$/i)) return match;
      return '<br/>' + match;
    });
    
    // 수동 인용 태그 파싱 (HTML 처리용)
    htmlText = htmlText.replace(/\[cite\s+rule="([^"]*)"\s+article="([^"]*)"(?:\s+url="([^"]*)")?\]([\s\S]*?)\[\/cite\]/gi, (match, rule, article, url, content) => {
      const urlAttr = url ? ` data-url="${url}"` : "";
      return `<a href="#" class="cited-article-link text-sky-700 font-bold underline underline-offset-2" data-rule-name="${rule}" data-article="${article}"${urlAttr}>${content}</a>`;
    });

    // 테이블 등 HTML 태그가 포함되어 있다면 dangerouslySetInnerHTML 사용
    if (/<table|<tr|<td|<th|<br|<p/i.test(htmlText)) {
      let hiddenNoCites: string[] = [];
      htmlText = htmlText.replace(/\[nocite\]([\s\S]*?)\[\/nocite\]/gi, (match, inner) => {
        hiddenNoCites.push(inner);
        return `__NOCITE_${hiddenNoCites.length - 1}__`;
      });

      htmlText = htmlText.replace(/__NOCITE_(\d+)__/g, (_, i) => hiddenNoCites[parseInt(i)]);

      if (/<table/i.test(htmlText)) {
        // 1. 빈 p, div, span 태그 제거 (예: <p>&nbsp;</p>, <p><br/></p>)
        let prev = '';
        while (htmlText !== prev) {
          prev = htmlText;
          htmlText = htmlText.replace(/<(p|div|span)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi, (match, tag, inner) => {
            const stripped = inner.replace(/<[^>]+>/g, '').replace(/\s|&nbsp;/gi, '');
            if (stripped === '') return ''; 
            return match;
          });
        }
        // 2. 표(table) 바로 앞에 연속된 <br/>, &nbsp;, 공백 모조리 제거
        htmlText = htmlText.replace(/(?:<br\s*\/?>|\s|&nbsp;)+<table/gi, '<table');
        // 3. table 자체의 margin-top 등 여백 스타일 제거
        htmlText = htmlText.replace(/<table([^>]*)style="([^"]*)"/gi, (match, before, styleContent) => {
          let newStyle = styleContent.replace(/margin-top\s*:\s*[^;]+;?/gi, '');
          newStyle = newStyle.replace(/margin\s*:\s*[^;]+;?/gi, '');
          return `<table${before}style="${newStyle}"`;
        });
        // 4. p 태그가 닫힌 직후 연속된 <br/> 제거
        htmlText = htmlText.replace(/<\/p>(?:<br\s*\/?>|\s|&nbsp;)+/gi, '</p>');
      }

      const wrapperCls = htmlText.includes('custom-rule-table')
        ? "html-content-inline"
        : "html-table-wrapper html-content-inline";

      if (searchKeyword && searchKeyword.trim().length > 0) {
        const keyword = searchKeyword.trim();
        const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![^<]*>)`, 'gi');
        htmlText = htmlText.replace(regex, `<mark class="highlight-mark bg-yellow-300 font-bold px-1 rounded shadow-sm">$1</mark>`);
      }

      return (
        <span 
          className={wrapperCls}
          dangerouslySetInnerHTML={{ __html: htmlText }} 
        />
      );
    }

    const parts = decodedText.split(/(\[cite\s+rule="[^"]*"\s+article="[^"]*"(?:\s+url="[^"]*")?\][\s\S]*?\[\/cite\]|\[nocite\][\s\S]*?\[\/nocite\]|[<(\[＜（](?:개정|제정|신설|삭제|본조신설|전문개정|전부개정|일부개정|단서신설|후단신설|단서삭제|장\s*변경|조\s*폐지|변경|폐지|표개정|조이동|조신설|항신설|호신설|목신설|표이동|본문이동|캠퍼스명칭변경|명칭변경|서식개정|서식신설|별표개정|별지개정|[가-힣\s,･]+개정|[가-힣\s,･]+신설|[가-힣\s,･]+이동|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?)[^>\])＞）]*[>\])＞）])/gi);
    return parts.map((part, i) => {
      if (/^[<(\[＜（](?:개정|제정|신설|삭제|본조신설|전문개정|전부개정|일부개정|단서신설|후단신설|단서삭제|장\s*변경|조\s*폐지|변경|폐지|표개정|조이동|조신설|항신설|호신설|목신설|표이동|본문이동|캠퍼스명칭변경|명칭변경|서식개정|서식신설|별표개정|별지개정|[가-힣\s,･]+개정|[가-힣\s,･]+신설|[가-힣\s,･]+이동|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?)/.test(part)) {
        return <span key={i} className="text-sky-700 font-medium text-[13px] ml-1">{normalizeHistoryDate(part)}</span>;
      }
      if (part.startsWith("[nocite")) {
        const content = part.replace(/^\[nocite\]|\[\/nocite\]$/gi, '');
        return <span key={i}>{content}</span>;
      }
      if (part.startsWith("[cite")) {
        const m = part.match(/\[cite\s+rule="([^"]*)"\s+article="([^"]*)"(?:\s+url="([^"]*)")?\]([\s\S]*?)\[\/cite\]/i);
        if (m) {
          return (
             <a 
               key={i} 
               href="#" 
               className="cited-article-link text-sky-700 font-bold underline underline-offset-2" 
               data-rule-name={m[1]} 
               data-article={m[2]}
               data-url={m[3] || undefined}
               onClick={(e) => e.preventDefault()}
             >
               {m[4]}
             </a>
          );
        }
      }
      
      if (searchKeyword && searchKeyword.trim().length > 0) {
        const keyword = searchKeyword.trim();
        const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const subParts = part.split(regex);
        return (
          <React.Fragment key={i}>
            {subParts.map((sub, subIdx) => 
              sub.toLowerCase() === keyword.toLowerCase() ? (
                <mark key={subIdx} className="highlight-mark bg-yellow-300 font-bold px-1 rounded shadow-sm">{sub}</mark>
              ) : (
                sub
              )
            )}
          </React.Fragment>
        );
      }
      
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  const renderLinesWithIndentation = (text: string) => {
    if (/<table/i.test(text) || !text.includes('\n')) {
      return renderTextWithHistory(text);
    }
    return text.split('\n').map((line, i) => {
      if (!line.trim() && i > 0) return null;
      if (i === 0) {
        return <React.Fragment key={i}>{renderTextWithHistory(line)}</React.Fragment>;
      }
      let indentStyle: React.CSSProperties = {};
      if (/^\s*[가-하]\./.test(line)) {
        indentStyle = { display: 'block', paddingLeft: '16px', textIndent: '-16px', marginTop: '4px' };
      } else if (/^\s*\d{1,2}(?:의\d+)?\./.test(line)) {
        indentStyle = { display: 'block', paddingLeft: '4px', textIndent: '-16px', marginTop: '4px' };
      } else {
        indentStyle = { display: 'block', marginTop: '4px' };
      }
      return (
        <span key={i} style={indentStyle}>
          {renderTextWithHistory(line)}
        </span>
      );
    });
  };

  function getBadgeInfo(text: string, fullContentText?: string) {
    let historyDates: string[] = [];
    const targetText = fullContentText ? `${text} ${fullContentText}` : text;
    const datesMatches = targetText.match(/\((?:삭제|개정|제정|신설|전문개정|전부개정|일부개정|본조신설|단서신설|후단신설|단서삭제|장\s*변경|조\s*폐지|변경|폐지|표개정|조이동|조신설|항신설|호신설|목신설|표이동|본문이동|캠퍼스명칭변경|명칭변경|서식개정|서식신설|별표개정|별지개정|[가-힣\s,･]+개정|[가-힣\s,･]+신설|[가-힣\s,･]+이동|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?)\s*[^)]*\)/g);
    if (datesMatches) {
      datesMatches.forEach(match => {
        const cleaned = match.replace(/[()]/g, '').trim();
        historyDates.push(cleaned);
      });
    }
    if (targetText.includes("<개정")) {
      const matches = targetText.match(/<개정[^>]*>/g);
      if (matches) {
        matches.forEach(m => {
          const match = m.match(/<개정(.*?)>/);
          if (match) historyDates.push(`개정 ${match[1].trim()}`);
        });
      }
    }
    // 중복 제거
    historyDates = Array.from(new Set(historyDates));
    const badgeType = historyDates.some(h => h.includes("개정")) ? "개" : "연";
    const badgeColor = badgeType === "개" ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100" : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100";
    const badgeTitle = badgeType === "개" ? "개정 이력 보기" : "연혁 정보 보기";
    return { historyDates, badgeType, badgeColor, badgeTitle };
  }

  // 파서 오류로 하나로 뭉쳐진 장/조/호 배열 텍스트를 정규식으로 동적 분할 및 포맷팅해주는 헬퍼
  function formatGluedText(text: string, isArticleBody: boolean = false): React.ReactNode {
    // 만약 전체 텍스트 내에 테이블 태그가 포함되어 있다면, 분할(split('\n')) 시 테이블 태그가 깨지는 것을 방지해야 함.
    // 하지만 텍스트가 제N조로 시작하는 경우 조문 제목과 뱃지는 추출해서 렌더링해야 함.
    const hasTable = /<table|<tr|<td|<th/i.test(text);
    
    if (hasTable) {
        // 테이블이 있지만 제N조로 시작하는 경우 제목을 먼저 추출
        const isRef = /^(?:<[^>]+>|\s|&nbsp;)*제\d+조(?:의\d+)?(?:(?:의(?!\d)|에|부터|까지|와|과|이나|나|를|을|은|는|이|가|,)|(?:\s|&nbsp;)*(?:제\d+[항호목]|등(?=[^가-힣]|에|의|을|를|은|는|이|가|와|과|나|$)|관련|단서|본문|각\s*호))/.test(text.trim()) || 
                      /^(?:<[^>]+>|\s|&nbsp;)*제\d+조(?:의\d+)?\s*[\[〔(（][^\]〕)）]+[\]〕)）](?:(?:의(?!\d)|에|부터|까지|와|과|이나|나|를|을|은|는|이|가|,)|(?:\s|&nbsp;)*(?:제\d+[항호목]|등(?=[^가-힣]|에|의|을|를|은|는|이|가|와|과|나|$)|관련|단서|본문|각\s*호))/.test(text.trim());
        if (/^(?:<[^>]+>|\s|&nbsp;)*제\d+(?:조|장|관|절)/.test(text) && !isRef) {
           const match2 = text.match(/^(?:<[^>]+>|\s|&nbsp;)*(제\d+조(?:의|\s+)?\d*)(?:(?:\s|&nbsp;)*)[\[〔(（]([^()]*?(?:\([^()]*\)[^()]*?)*)[\]〕)）]([\s\S]*)/i) || text.match(/^(?:<[^>]+>|\s|&nbsp;)*(제\d+조(?:의|\s+)?\d*)\s*([\s\S]*)/i);
           if (match2) {
               let articleNum = match2[1].replace(/\s/g, '');
               if (articleNum.match(/^제\d+조\d+$/)) {
                   articleNum = articleNum.replace(/조(\d+)$/, '조의$1');
               }
               
               let titleText = "";
               let bodyText = "";
               
               if (match2.length === 4) { // First regex matched
                   titleText = `(${match2[2].trim()})`;
                   bodyText = match2[3].trim();
               } else { // Second regex matched
                   titleText = "";
                   bodyText = match2[2].trim();
               }
               
               // Remove leading <br/> from bodyText so it doesn't force a newline
               bodyText = bodyText.replace(/^(?:<br\s*\/?>\s*)+/i, '');
               
               const fullTitle = articleNum + titleText;
               const { historyDates, badgeType, badgeColor, badgeTitle } = getBadgeInfo(text.split(/<table/i)[0]);
               
               return (
                  <div key={`glued-table`} id={`toc-${articleNum}`} className="mt-4 mb-0 flex items-start gap-2 pt-1 relative w-[calc(100%+52px)] -ml-[52px] group/text">
                     {renderEditButton(true)}
                     {onTogglePrintSelect && articleId && (
                       <div className="flex items-center mr-1 mt-0.5">
                         <input 
                           type="checkbox" 
                           checked={isSelectedForPrint} 
                           onChange={(e) => onTogglePrintSelect(articleId, e.target.checked)} 
                           className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                         />
                       </div>
                     )}
                     {!hideBadge && (
                       <div className="flex items-center gap-1 mt-0.5 z-10">
                         <button 
                           onClick={(e) => { e.stopPropagation(); handleOpenHistory(historyDates); }}
                           title={badgeTitle}
                           className={`w-5 h-5 shrink-0 flex items-center justify-center rounded text-[11px] font-bold cursor-pointer transition-colors border ${badgeColor}`}
                         >
                           {badgeType}
                         </button>
                         <button 
                           onClick={(e) => { e.stopPropagation(); handlePrintArticle(text); }}
                           title="해당 조문 인쇄하기"
                           className="w-5 h-5 shrink-0 flex items-center justify-center rounded text-[11px] font-bold cursor-pointer transition-colors border bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
                         >
                           인
                         </button>
                       </div>
                     )}
                     <div className="flex-1 w-full group text-[16px] text-slate-800 leading-[1.7]">
                        <div className="w-full break-keep inline-block">
                           <span className="font-bold text-[#000080]">{articleNum}</span>
                           {titleText && <span className="font-normal text-slate-800 ml-1 mr-1">{titleText}</span>}
                           {bodyText && <span className="font-normal text-slate-800">{renderTextWithHistory(bodyText)}</span>}
                        </div>
                     </div>
                  </div>
               );
           }
        }
        return renderTextWithHistory(text);
    }

    if (text.length < 50 && !/^\s*제\d+(?:조|장|관|절)/.test(text)) {
        if (!hideHistory && (text.includes("제정") || text.includes("개정") || text.includes("시행")) && /^\s*[\[〔]/.test(text)) {
             return <span className="text-[14px] text-blue-600 font-medium">[{text.replace(/[\[\]〔〕]/g, '')}]</span>;
        }
        return <span className={isArticleBody ? "font-normal text-slate-800" : ""}>{renderTextWithHistory(text)}</span>;
    }

    // 1. Convert block-level HTML tags (<p>, <br>) to newlines so that we can process lines accurately.
    let formatted = text
      .replace(/<\/?p[^>]*>/gi, '\n')
      .replace(/<\/?div[^>]*>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\n\s*①/g, ' ①')
      .replace(/\n\s*\n/g, '\n')
      .replace(/④\s*항은\s*\n+\s*①/g, '④ 항은 ①')
      .trim();

    formatted = formatted
      .replace(/(^|\s)[?•·○●\uF0B7]\s+(?=[가-하]\.|\d{1,2}(?:의\d+)?\.)/g, '$1')
      .replace(/([①-⑳])/g, (match, p1, offset, string) => {
        const before = string.slice(0, offset);
        const after = string.slice(offset + 1);
        
        if (string.includes("①, ②, 호는") || string.includes("호는 1, 2") || string.includes("목은 가, 나")) return match;
        const recentBefore = before.slice(-50);
        if ((recentBefore.includes("④ 항은") || recentBefore.includes("부칙 조항의 표시는") || recentBefore.includes("연장 표시하지")) && p1 !== '④' && p1 !== '⑤') {
          return match;
        }

        // 인용구인 경우 (예: 제①항, 제1항 및 ②항) 줄바꿈 생략
        if (/(?:제|전|\(|,|및|또는|와|과|이나|나|에|의|구분은|경우에|때에는|\(거\))\s*$/.test(before)) return match;
        if (/^\s*(?:항|호)/.test(after)) return match;

        // 이미 제일 앞이거나 줄바꿈이 있는 경우 생략
        if (offset === 0 || before.match(/(?:^|\n)\s*$/)) return match;
        
        // 조문 제목 바로 뒤에 나오는 ① 등은 줄바꿈하지 않음
        if (before.match(/^(?:<[^>]+>)*(?:제\d+조(?:의\d+)?(?:<[^>]+>)*\s*)?(?:\[[^\]]*\]|〔[^〕]*〕|\([^)]*\)|（[^）]*）)?\s*(?:<[^>]+>)*\s*$/)) return match;

        return '\n' + match;
      })
      .replace(/(\s|>|&nbsp;|<br\s*\/?>)(\d{1,2}(?:의\d+)?\.)\s*(?=[^\d])/g, (match, p1, p2, offset, string) => {
        if (string.includes("①, ②, 호는") || string.includes("호는 1, 2") || string.includes("목은 가, 나")) return match;
        const before = string.slice(0, offset + p1.length);
        const recentBefore = before.slice(-50);
        if (recentBefore.includes("④ 항은") || recentBefore.includes("부칙 조항의 표시는") || recentBefore.includes("연장 표시하지")) {
          return match;
        }
        if (offset === 0 || before.match(/(?:^|\n)\s*$/)) return match;
        // 인용구인 경우 생략
        if (before.match(/(?:제|전|\(|,|및|또는|와|과|이나|나|에|의|구분은|경우에|때에는|\(거\))\s*$/)) return match;
        // 날짜(예: 2008. 7.) 내부인 경우 생략
        if (before.match(/\d+(?:의\d+)?\.\s*$/)) return match;
        // < > 태그 내부인 경우 생략 (p1이 > 이면 태그가 끝난 직후이므로 줄바꿈 허용)
        if (p1 !== '>') {
            const openAngles = (before.match(/</g) || []).length;
            const closeAngles = (before.match(/>/g) || []).length;
            if (openAngles > closeAngles) return match;
        }
        
        return p1 + '\n' + p2 + ' ';
      })
      .replace(/(^|\s)([가-하]\.)[ \t]+/g, (match, p1, p2, offset, string) => {
        if (string.includes("①, ②, 호는") || string.includes("호는 1, 2") || string.includes("목은 가, 나")) return match;
        const before = string.slice(0, offset + p1.length);
        const recentBefore = before.slice(-50);
        if (recentBefore.includes("④ 항은") || recentBefore.includes("부칙 조항의 표시는") || recentBefore.includes("연장 표시하지")) {
          return match;
        }
        if (offset === 0 || before.match(/(?:^|\n)\s*$/)) return match;
        if (before.match(/(?:제|전|\(|,|및|또는|와|과|이나|나|에|의|구분은|경우에|때에는|\(거\))\s*$/)) return match;
        return p1 + '\n' + p2 + ' ';
      })
      .replace(/(제\d+조의?\d*\s*[\[〔(（].*?[\]〕)）])\s*\n+(?=[^\n])/g, '$1 ')
      .replace(/(^|\n|[.!?]\s*)((?<![『「])제\d+조의?\d*\s*(?:\[(?![ \s\S]*?\[\/cite\])|[〔(（]).*?[\]〕)）])/g, '$1\n\n$2')
      .replace(/(제\d+(?:장|절|관)\s+(?!(?:제\d+(?:조|항|호|목|장|절|관)?|및|에|의|은|는|이|가|을|를|과|와)(?:\s|$))[^\s]+)/g, (match, p1, offset, string) => {
         if (offset > 0) {
             const beforeMatch = string.slice(0, offset).trim();
             if (beforeMatch.length > 0) {
                 const prevChar = beforeMatch[beforeMatch.length - 1];
                 if (/[가-힣A-Za-z0-9"“'‘\[(]/.test(prevChar)) {
                     return match;
                 }
             }
         }
         return '\n\n' + p1;
      })
      .replace(/(^|\n)(부\s*칙)\s*(.*)/g, '\n\n$2 $3')
      // 부칙 바로 뒤의 날짜 괄호/꺽쇠는 붙여두고, 그 뒤에 이어지는 시행일(숫자 또는 괄호) 앞에서 줄바꿈 수행
      .replace(/(부\s*칙\s*(?:\([^)]*\)|<[^>]*>|\[[^\]]*\]|〔[^〕]*〕)?)\s+(\d{1,2}\.|\([가-힣\s·]{2,}\))/gi, '$1\n$2');

    // 1. Addendum Keywords: Break unconditionally only in Addendum Articles
    formatted = formatted.replace(/(\([^)]*(?:시행일|경과조치|적용례|적용범위|준용|폐지|예외|단서|특례|임기|존속기간|관련|시행|적용)[^)]*\))/g, (match, paren, offset, str) => {
      const before = str.slice(0, offset);
      if (before.match(/\n\s*$/)) return match;
      if (before.match(/\d+(?:의\d+)?\.\s*$/)) return match;
      if (before.match(/제\d+조의?\d*\s*$/)) return match;
      if (before.match(/\d\s*$/)) return match;
      
      if (!isAddendumArticle) return match;
      
      return '\n' + match;
    });

    // 2. Normal Parentheses: Break only if boundary conditions are met
    formatted = formatted.replace(/(\((?:<[^>]+>)*[가-힣A-Za-z0-9\s·,\u200B-\u200D\uFEFF]{2,}[^)]*\))/g, (match, paren, offset, str) => {
      const before = str.slice(0, offset);
      if (before.match(/\n\s*$/)) return match;
      if (before.match(/\d+(?:의\d+)?\.\s*$/)) return match;
      if (before.match(/제\d+조의?\d*\s*$/)) return match;
      if (before.match(/\d\s*$/)) return match;

      if (!isAddendumArticle) {
        return match;
      }

      if (!before.match(/(?:^|[.\s>\]]|&nbsp;)$/i)) return match;
      return '\n' + match;
    });

    // Restore hidden citation tags to avoid them being split by newlines
    let hiddenCitations: string[] = [];
    formatted = formatted.replace(/\[cite[\s\S]*?\[\/cite\]|\[nocite\][\s\S]*?\[\/nocite\]/g, (match) => {
       hiddenCitations.push(match);
       return `__CITATION_${hiddenCitations.length - 1}__`;
    });

    let curHang = "";
    let curHo = "";
    let curMok = "";
    let currentIndent = isArticleBody ? "40px" : "0px";
    const baseArticlePath = `제${articleNumber}조`;

    const handleItemSelect = (e: React.MouseEvent, path: string) => {
      
      e.stopPropagation();
      const safeRuleName = title || document.title;
      if (window.confirm(`선택한 조문: [${safeRuleName}] ${path}\n이 조문을 인용으로 연결하시겠습니까?`)) {
         window.opener?.postMessage({ type: 'RULE_SELECTED', title: safeRuleName, articleNum: path }, '*');
         window.close();
      }
    };

    const InlineSelectBadge = () => {
      
      return (
        <div className="absolute top-1/2 -translate-y-1/2 right-2 hidden group-hover:flex bg-blue-600 text-white text-[11px] font-bold px-2 py-1 rounded shadow pointer-events-none items-center gap-1 z-10">
          ✅ 선택
        </div>
      );
    };

    const lines = formatted.split('\n').map(l => l.trim()).filter(l => l);

    let hasSeenContent = false;

    return (
      <>
        {lines.map((trimmedLine, idx) => {
          let trimmed = trimmedLine.replace(/__CITATION_(\d+)__/g, (_, i) => hiddenCitations[parseInt(i, 10)] || '');
          let lineClass = "break-keep text-slate-800";
          
          let isHoOrMok = /^\d{1,2}(?:의\d+)?\./.test(trimmed) || /^[가-하]\./.test(trimmed);
          let isInline = false;
          
          if (isArticleBody) {
             if (!hasSeenContent && !isHoOrMok) {
                isInline = true;
             }
          }
          
          let textWithoutHistory = trimmed.replace(/<[^>]+>/g, '').replace(/\[[^\]]+\]/g, '').trim();
          let isJustTitle = /^\(.*\)$/.test(textWithoutHistory);
          
          if (!isJustTitle) {
             hasSeenContent = true;
          }

          let currentPath = baseArticlePath;

          if (/^[①-⑳]/.test(trimmed)) {
             const numMatch = trimmed.match(/^([①-⑳])\s*(.*)/);
             if (numMatch) {
               curHang = `제${convertCircledNum(numMatch[1])}항`;
               curHo = ""; curMok = ""; currentIndent = isArticleBody ? "40px" : "72px";
               currentPath = `${baseArticlePath} ${curHang}`.trim();
               const interactiveClass = "";
               if (isInline) {
                 return (
                   <span key={`glued-${idx}`} className={`font-normal text-slate-800 break-keep inline ${interactiveClass}`}>
                     <span className="mr-1">{numMatch[1]}</span>
                     {renderTextWithHistory(numMatch[2])}{" "}
                     
                   </span>
                 );
               }
               return (
                  <div key={`glued-${idx}`} className={`block w-full break-keep text-slate-800 py-0.5 ${interactiveClass}`} style={{ paddingLeft: isArticleBody ? '40px' : '72px', textIndent: '-20px' }}>
                     <span className="font-normal mr-1">{numMatch[1]}</span>
                     <span className="font-normal">{renderTextWithHistory(numMatch[2])}</span>
                     
                  </div>
               );
             }
             lineClass += " block";
          } else if (/^\d{1,2}(?:의\d+)?\./.test(trimmed)) {
             const numMatch = trimmed.match(/^(\d{1,2}(?:의\d+)?\.)\s*(.*)/);
             if (numMatch) {
               curHo = `제${numMatch[1].replace('.', '')}호`;
               curMok = ""; currentIndent = isArticleBody ? "56px" : "88px";
               currentPath = `${baseArticlePath} ${curHang} ${curHo}`.replace(/\s+/g, ' ').trim();
               const interactiveClass = "";
               const isGluedAddendum = !isAddendumArticle && (/^(?:\(시행일\))?\s*이\s*규정은.*시행한다/i.test(numMatch[2].trim()) || /^\((?:시행일|경과조치|적용례|준용|폐지)\)/i.test(numMatch[2].trim()));
               if (isGluedAddendum) {
                 return (
                   <div key={`glued-${idx}`} id="toc-addendum-glued" className="mt-12 mb-2 w-[calc(100%+52px)] -ml-[52px] pt-4 border-t border-slate-200 pl-[52px]">
                     <p className="font-bold text-[16px] text-slate-900 mb-2">부칙</p>
                     <div className="w-full break-keep text-[16px] text-slate-800 leading-[1.8] pl-4" style={{ textIndent: '-16px' }}>
                       <span className="font-normal mr-1">{numMatch[1]}</span>
                       <span className="font-normal">{renderTextWithHistory(numMatch[2])}</span>
                     </div>
                   </div>
                 );
               }
               if (isInline) {
                 return (
                   <span key={`glued-${idx}`} className={`font-normal text-slate-800 break-keep inline ${interactiveClass}`}>
                     <span className="mr-1">{numMatch[1]}</span>
                     {renderTextWithHistory(numMatch[2])}{" "}
                     
                   </span>
                 );
               }
               return (
                  <div key={`glued-${idx}`} className={`w-full break-keep text-slate-800 py-0.5 ${interactiveClass}`} style={{ paddingLeft: isArticleBody ? '56px' : '88px', textIndent: '-16px' }}>
                     <span className="font-normal mr-1">{numMatch[1]}</span>
                     <span className="font-normal">{renderTextWithHistory(numMatch[2])}</span>
                     
                  </div>
               );
             }
             lineClass += " ml-2 block";
          } else if (/^[가-하]\./.test(trimmed)) {
             const numMatch = trimmed.match(/^([가-하]\.)\s*(.*)/);
             if (numMatch) {
               curMok = `${numMatch[1].replace('.', '')}목`; currentIndent = isArticleBody ? "72px" : "104px";
               currentPath = `${baseArticlePath} ${curHang} ${curHo} ${curMok}`.replace(/\s+/g, ' ').trim();
               const interactiveClass = "";
               if (isInline) {
                 return (
                   <span key={`glued-${idx}`} className={`font-normal text-slate-800 break-keep inline ${interactiveClass}`}>
                     <span className="mr-1">{numMatch[1]}</span>
                     {renderTextWithHistory(numMatch[2])}{" "}
                     
                   </span>
                 );
               }
               return (
                  <div key={`glued-${idx}`} className={`w-full break-keep text-slate-800 py-0.5 ${interactiveClass}`} style={{ paddingLeft: isArticleBody ? '72px' : '104px', textIndent: '-16px' }}>
                     <span className="font-normal mr-1">{numMatch[1]}</span>
                     <span className="font-normal">{renderTextWithHistory(numMatch[2])}</span>
                     
                  </div>
               );
             }
             lineClass += " ml-4 block";
          } else if (/^제\d+조/.test(trimmed) && !/[『「]$/.test(trimmed.slice(0, trimmed.search(/제\d+조/))) && 
                     !/^제\d+조(?:의\d+)?(?:(?:의(?!\d)|에|부터|까지|와|과|이나|나|를|을|은|는|이|가|,)|(?:\s|&nbsp;)*(?:제\d+[항호목]|등(?=[^가-힣]|에|의|을|를|은|는|이|가|와|과|나|$)|관련|단서|본문|각\s*호))/.test(trimmed) && 
                     !/^제\d+조(?:의\d+)?\s*[\[〔(（][^\]〕)—]+[\]〕)—](?:(?:의(?!\d)|에|부터|까지|와|과|이나|나|를|을|은|는|이|가|,)|(?:\s|&nbsp;)*(?:제\d+[항호목]|등(?=[^가-힣]|에|의|을|를|은|는|이|가|와|과|나|$)|관련|단서|본문|각\s*호))/.test(trimmed)) {
             const m = trimmed.match(/^(제\d+조(?:의|\s+)?\d*)(?:(?:\s|&nbsp;)*)[\[〔(（]([^()]*?(?:\([^()]*\)[^()]*?)*)[\]〕)）]([\s\S]*)/) || trimmed.match(/^(제\d+조(?:의|\s+)?\d*)(?:(?:\s|&nbsp;)*)(.*)/);
             if (m) {
                 let articleNum = m[1].replace(/\s/g, '');
                 if (articleNum.match(/^제\d+조\d+$/)) {
                     articleNum = articleNum.replace(/조(\d+)$/, '조의$1');
                 }
                 let titleText = "";
                 let body = "";
                 if (m.length === 4) {
                     titleText = `(${m[2].trim()})`;
                     body = m[3].trim();
                 } else {
                     body = m[2].trim();
                 }
                 const { historyDates, badgeType, badgeColor, badgeTitle } = getBadgeInfo(trimmed);
                 return (
                    <div key={`glued-${idx}`} id={`toc-${articleNum}`} className="mt-4 mb-0 flex items-start gap-2 pt-1 relative w-[calc(100%+52px)] -ml-[52px] group/text">
                       {renderEditButton(true)}
                       {onTogglePrintSelect && articleId && (
                         <div className="flex items-center mr-1 mt-0.5">
                           <input 
                             type="checkbox" 
                             checked={isSelectedForPrint} 
                             onChange={(e) => onTogglePrintSelect(articleId, e.target.checked)} 
                             className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                           />
                         </div>
                       )}
                       {!hideBadge && (
                         <div className="flex items-center gap-1 mt-0.5 z-10">
                           <button 
                             onClick={() => handleOpenHistory(historyDates)}
                             title={badgeTitle}
                             className={`w-5 h-5 shrink-0 flex items-center justify-center rounded text-[11px] font-bold cursor-pointer transition-colors border ${badgeColor}`}
                           >
                             {badgeType}
                           </button>
                           <button 
                             onClick={(e) => { e.stopPropagation(); handlePrintArticle(trimmed); }}
                             title="해당 조문 인쇄하기"
                             className="w-5 h-5 shrink-0 flex items-center justify-center rounded text-[11px] font-bold cursor-pointer transition-colors border bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
                           >
                             인
                           </button>
                         </div>
                       )}
                       <div className={`flex-1 w-full group text-[16px] text-slate-800 leading-[1.7] ${hideBadge ? 'ml-[52px]' : ''}`}>
                          <div className="w-full break-keep inline-block">
                             <span className="font-bold text-[#000080]">{articleNum}</span>
                             {titleText && <span className="font-normal text-slate-800 ml-1 mr-1">{titleText}</span>}
                             {body && <> {formatGluedText(body, true)}</>}
                          </div>
                       </div>
                    </div>
                 );
             } else {
                 lineClass += " mt-4 mb-2 text-[16px] font-bold text-[#000080] block";
             }
          } else if (/^부\s*칙/.test(trimmed) || /^칙\s/.test(trimmed) || (isAddendumArticle && /^칙/.test(trimmed))) {
             const match = trimmed.match(/^(?:부\s*칙\s*)+/) || trimmed.match(/^(칙)\s*/);
             if (match) {
                 let titlePart = title || "부칙";
                 // DB에 "부" 또는 "칙"으로 잘못 저장된 경우 보정
                 if (["부", "부 ", "칙", "칙 "].includes(titlePart)) {
                     titlePart = "부칙";
                 }
                 let body = trimmed;
                 if (titlePart && body.startsWith(titlePart)) {
                     body = body.substring(titlePart.length).trim();
                 } else {
                     body = body.replace(/^(?:부\s*칙\s*)+/, '').trim();
                     body = body.replace(/^칙\s*/, '').trim();
                     const titleDateMatch = (title || "").match(/^부\s*칙\s*(\([^)]+\))/);
                     if (titleDateMatch && body.startsWith(titleDateMatch[1])) {
                         body = body.substring(titleDateMatch[1].length).trim();
                     }
                 }
                 const { historyDates, badgeType, badgeColor, badgeTitle } = getBadgeInfo(trimmed);
                 return (
                    <div key={`glued-${idx}`} className="mt-4 mb-0 flex items-start gap-2 pt-1 relative w-[calc(100%+52px)] -ml-[52px]">
                       {onTogglePrintSelect && articleId && (
                         <div className="flex items-center mr-1 mt-0.5">
                           <input 
                             type="checkbox" 
                             checked={isSelectedForPrint} 
                             onChange={(e) => onTogglePrintSelect(articleId, e.target.checked)} 
                             className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                           />
                         </div>
                       )}
                       {!hideBadge && (
                         <div className="flex items-center gap-1 mt-0.5 z-10">
                           <button 
                             onClick={() => handleOpenHistory(historyDates)}
                             title={badgeTitle}
                             className={`w-5 h-5 shrink-0 flex items-center justify-center rounded text-[11px] font-bold cursor-pointer transition-colors border ${badgeColor}`}
                           >
                             {badgeType}
                           </button>
                           <button 
                             onClick={(e) => { e.stopPropagation(); handlePrintArticle(trimmed); }}
                             title="해당 조문 인쇄하기"
                             className="w-5 h-5 shrink-0 flex items-center justify-center rounded text-[11px] font-bold cursor-pointer transition-colors border bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
                           >
                             인
                           </button>
                         </div>
                       )}
                       <div className={`flex-1 w-full group text-[16px] text-slate-800 leading-[1.7] ${hideBadge ? 'ml-[52px]' : ''}`}>
                          <div className="w-full break-keep inline-block">
                             <span className="font-bold mr-1 text-slate-900">{titlePart}</span>
                             {body && <span className="font-normal text-slate-800">{renderTextWithHistory(body)}</span>}
                          </div>
                       </div>
                    </div>
                 );
             } else {
                 lineClass += " mt-8 mb-2 text-[16px] font-bold text-[#000080] block";
             }
          } else if (/^제\d+장/.test(trimmed)) {
             lineClass += " mt-6 text-[18px] font-black text-center text-[#000080] block";
          } else if (/^제\d+(?:절|관)/.test(trimmed)) {
             lineClass += " mt-4 text-[16px] font-bold text-center text-[#000080] block";
          } else {
             if (/^제\d+장/.test(trimmed) || /^제\d+(?:절|관)/.test(trimmed)) {
                 currentIndent = '0px';
             }
             if (isInline) {
                lineClass += " font-normal text-slate-800";
             } else {
                return (
                   <div key={`glued-${idx}`} className={`block w-full break-keep text-slate-800 py-0.5`} style={{ paddingLeft: currentIndent }}>
                     {renderTextWithHistory(trimmed)}
                   </div>
                );
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

  let displayItems = [...items];
  for (let i = 0; i < displayItems.length - 1; i++) {
      const curr = displayItems[i];
      const next = displayItems[i+1];
      if (curr && (curr.type === "article" || curr.type === "paragraph" || curr.type === "text") && next && (next.type === "paragraph" || next.type === "text" || next.type === "item")) {
          const currTextPlain = String(curr.text || "").replace(/<[^>]+>/g, '').trim();
          const nextTextPlain = String(next.text || "").replace(/<[^>]+>/g, '').trim();
          
          let isJustArticleTitle = false;
          if (/^제\d+조/.test(currTextPlain)) {
              const cleanTitleCheck = currTextPlain.replace(/^제\d+조(?:의\d+)?\s*(?:\([^)]*\))?/, '').trim();
              if (cleanTitleCheck.length < 5) {
                  isJustArticleTitle = true;
              }
          }

          if (currTextPlain === "" || /^\([^)]+\)$/.test(currTextPlain) || isJustArticleTitle || currTextPlain.endsWith("④ 항은") || currTextPlain.endsWith("④항은")) {
              if (!/^제\d+조/.test(nextTextPlain)) {
                  displayItems[i] = { ...curr, text: (curr.text ? curr.text + " " : "") + (next.num ? next.num + " " : "") + (next.text || "") };
                  displayItems.splice(i+1, 1);
                  i--;
              }
          }
      }
  }

  let currentParagraphStr = "";
  let currentItemStr = "";
  let currentSubitemStr = "";
  let hasRenderedEditBtn = false;

  // ─────────────────────────────────────────────────────────
  // 부칙 전용 통합 렌더러
  // isAddendumArticle이 true이면 여기서 바로 반환 → 하위 중복 분기 없음
  // ─────────────────────────────────────────────────────────
  if (isAddendumArticle) {
    // ── 1. 모든 아이템에서 텍스트 수집 (별표/별지 나오면 이후 무시)
    const rawLines: string[] = [];
    for (const item of displayItems) {
      if (!item) continue;
      const itemText = String(item.text || "").trim();
      // 별표/별지/서식으로 시작하는 아이템이 나오면 이후는 모두 찌꺼기이므로 중단
      if (/^[\[〔【<]\s*(별표|별지|서식|별첨)/.test(itemText)) break;
      // num이 있는 article 타입: "제N조(제목) 본문" 형태로 합쳐서 추가
      let raw = "";
      if (item.type === "article" && item.num) {
        raw = (item.num + " " + itemText).trim();
      } else {
        raw = itemText;
      }
      if (!raw) continue;
      raw = raw.replace(/^(?:부\s*칙\s*)+/, "").trim();
      if (raw) rawLines.push(raw);
    }

    // ── 2. 전체 텍스트 결합 (비어있으면 contentText fallback)
    let fullText = rawLines.join("\n");
    if (!fullText && contentText) {
      fullText = contentText.replace(/^(?:부\s*칙\s*)+/, "").trim();
    }

    // ── 2.5 DB 업데이트가 누락되었거나 너무 커서 실패한 경우를 위한 안전장치: HTML 표(table) 내부의 개행문자(엔터) 제거
    fullText = fullText.replace(/<table[\s\S]*?<\/table>/gi, match => {
      let clean = match.replace(/\r?\n/g, '');
      // 특정 표(종전 재적학부)의 상단 2개 행을 자동으로 th로 변환하여 CSS 음영이 올바르게 적용되도록 처리
      if (clean.includes('종전 재적학부') && clean.includes('변경된 재적학부')) {
         clean = clean.replace(/<td([^>]*)>(.*?)종전\s*재적학부\(과\)\s*및\s*전공(.*?)<\/td>/g, '<th$1>$2종전 재적학부(과) 및 전공$3</th>');
         clean = clean.replace(/<td([^>]*)>(.*?)변경된\s*재적학부\(과\)\s*및\s*전공(.*?)<\/td>/g, '<th$1>$2변경된 재적학부(과) 및 전공$3</th>');
         // 띄어쓰기나 &nbsp;가 포함된 학부(과), 전공도 매칭
         clean = clean.replace(/<td([^>]*)>(.*?)학부(?:\s|&nbsp;)*(?:\(\s*과\s*\)|과)(.*?)<\/td>/gi, '<th$1>$2학부(과)$3</th>');
         clean = clean.replace(/<td([^>]*)>(.*?)전(?:\s|&nbsp;)*공(.*?)<\/td>/gi, '<th$1>$2전공$3</th>');
         // 글로벌문화예술경영학부 등 첫번째 열의 굵은 글씨가 불필요하게 음영처리되는 것을 막기 위해 인라인 bold 제거
         clean = clean.replace(/font-weight:\s*bold/gi, 'font-weight: normal');
      }
      return clean;
    });


    // ── 3. 헤더 날짜 어노테이션 추출
    // 첫 토큰이 <제정 날짜> 또는 (제정 날짜) 형태이면 부칙 헤더 줄에 붙임
    let headerAnnotation = "";
    const annotationMatch = fullText.match(/^([<(][^>)]+[>)])\s*/);
    if (annotationMatch) {
      const candidate = annotationMatch[1];
      if (/\d{2,4}\.|\d{4}년|개정|제정|신설/.test(candidate)) {
        let normalized = candidate;
        if (normalized.startsWith("(")) {
          normalized = "<" + normalized.substring(1, normalized.length - 1) + ">";
        }
        // 날짜 끝에 마침표 보정
        normalized = normalized.replace(/(\d{1,2})([>)])$/, "$1.$2");
        headerAnnotation = normalized;
        fullText = fullText.substring(annotationMatch[0].length).trim();
      }
    }

    // title이 "부칙 (날짜)" 형태면 title에서 날짜 추출
    // 단, "제N조..." 형태의 조문 번호이면 headerAnnotation으로 쓰지 않음
    if (!headerAnnotation && title && title !== "부칙" && !/^부\s*칙$/.test(title.trim())) {
      const titleRest = title.replace(/^부\s*칙\s*/, "").trim();
      // "제N조..." 형태이면 조문 제목이므로 스킵, 날짜/제정/개정 키워드 있는 경우에만 headerAnnotation으로 설정
      if (titleRest && !/^제\d+조/.test(titleRest) && /\d{2,4}[.\s년]|개정|제정|신설/.test(titleRest)) {
        let normalized = titleRest;
        if (normalized.startsWith("(")) {
          normalized = "<" + normalized.substring(1, normalized.length - 1) + ">";
        }
        normalized = normalized.replace(/(\d{1,2})([>])$/, "$1.$2");
        headerAnnotation = normalized;
      }
    }

    // 중복되는 부칙/조 제목 접두사 제거 및 조문제목 없는 본문 찌꺼기(DB 파싱 오류) 제거
    const lines = fullText.split('\n');
    const newLines: string[] = [];
    const seenCoreTexts = new Set<string>();

    for (let i = 0; i < lines.length; i++) {
      const currentLine = lines[i].trim();
      if (currentLine === "") continue;
      
      if (i < lines.length - 1) {
        const nextLine = lines[i+1].trim();
        // 현재 줄이 "제N조(...)" 형태이고, 다음 줄이 현재 줄과 정확히 동일한 내용으로 시작하는 경우
        if (/^(?:부칙\s*)?제\d+조(?:의\s*\d+)?\s*\(.*?\)$/.test(currentLine)) {
          if (nextLine.startsWith(currentLine)) {
            continue; // 중복된 현재 줄(제목만 있는 줄)을 건너뜀
          }
        }
      }

      // 조문제목 없는 본문 중복 찌꺼기 제거 (ex: 제N조 본문이 뒤에 제목 없이 다시 나오는 경우)
      let coreText = currentLine;
      const match1 = currentLine.match(/^(?:부칙\s*)?제\d+조(?:의\s*\d+)?\s*\([^)]*\)\s*(.*)/);
      if (match1) {
        coreText = match1[1].trim();
      } else {
        const match2 = currentLine.match(/^(?:부칙\s*)?제\d+조(?:의\s*\d+)?\s+(.*)/);
        if (match2) coreText = match2[1].trim();
      }

      // '1.', '①' 등 짧은 기호로만 된 경우 오작동 방지
      coreText = coreText.replace(/^[①-⑳\d]+[.)]?\s*/, '').trim();

      if (coreText && coreText.length > 10) {
        let isDuplicate = false;
        // 제목이 없는 줄인 경우, 이전에 나온 조문 본문과 동일한지 확인
        if (!/^(?:부칙\s*)?제\d+조/.test(currentLine) && !/^[①-⑳\d]+[.)]/.test(currentLine)) {
          const normalizedCore = coreText.replace(/\s+/g, '').replace(/[.·]/g, '');
          if (normalizedCore.length > 15) {
            for (const seen of seenCoreTexts) {
              const normalizedSeen = seen.replace(/\s+/g, '').replace(/[.·]/g, '');
              if (normalizedSeen.length > 15 && (normalizedCore.startsWith(normalizedSeen) || normalizedSeen.startsWith(normalizedCore))) {
                isDuplicate = true;
                break;
              }
            }
          }
          if (!isDuplicate && seenAddendumCoreTexts) {
            const normalizedCore = coreText.replace(/\s+/g, '').replace(/[.·]/g, '');
            if (normalizedCore.length > 15) {
               for (const seen of seenAddendumCoreTexts) {
                 if (normalizedCore.startsWith(seen) || seen.startsWith(normalizedCore)) {
                   isDuplicate = true;
                   break;
                 }
               }
            }
          }
        }
        if (isDuplicate) continue;
        seenCoreTexts.add(coreText);
      }
      
      newLines.push(currentLine);
    }
    fullText = newLines.join('\n');

    // 개행으로 쪼개진 번호(숫자. 또는 제N조)와 (시행일) 키워드 괄호를 하나로 묶음
    fullText = fullText
      .replace(/((?:^|\n)\d{1,2}\.)\s*\n\s*(?=\()/g, "$1 ")
      .replace(/((?:^|\n)제\d+조(?:의\s*\d+)?)\s*\n\s*(?=\()/g, "$1");

    // ── 4. 본문을 절 단위로 분리
    // (시행일), (준용), (경과조치) 등 키워드로 시작하는 절, 또는 1. / 제1조 형식
    const clauseSplitter = /(?=(?<!(?:^|\n|\s)\d{1,2}\.\s*|제\d+조(?:의\s*\d+)?\s*)\((?:시행일|준용|경과|적용|폐지|시행|별칙|준칙|특례|위임)[^)]*\)|(?:^|\n)\d{1,2}\.\s|(?:^|\n)제\d+조)/gm;
    const clauses: string[] = fullText
      ? fullText.split(clauseSplitter).map(s => s.trim()).filter(s => s)
      : [];

    // 별지/별표 찌꺼기 제거
    // 본문 중 인용구(예: [별표 1]에 의거)가 잘려나가는 것을 방지하기 위해 부정형 전방탐색 적용
    const cleanedClauses = clauses.map(c =>
      c.replace(/\s*(?:\[|〔|【|<)\s*(?:별지|별표|서식|별첨)[^\]〕】>]*?(?:\]|〕|】|>)(?!\s*(?:에|의|은|는|이|가|을|를|과|와|부터|까지|도|로|으로|만|의거|참조|따라|따른|관하여|관한|\[)).*$/gi, "").trim()
    ).filter(c => c);

    return (
      <div id={id} data-article-id={articleId} className="animate-fade-in rule-viewer-content font-['Pretendard'] w-full">
        {/* 부칙 헤더: "부칙 <개정 날짜>" 한 줄 (자식 부칙이 아닌 경우에만 출력) */}
        {!isBundleChild && (
          <p className="font-bold text-[16px] text-slate-900 mb-1 mt-1">
            부칙
            {headerAnnotation && (
              <span className="font-normal text-[13px] text-sky-700 ml-2">
                {renderTextWithHistory(headerAnnotation)}
              </span>
            )}
          </p>
        )}
        {/* 부칙 본문 - 각 절 개별 줄 */}
        <div className="text-[16px] text-slate-800 leading-[1.8]">
          {cleanedClauses.length > 0
            ? cleanedClauses.map((clause, i) => (
                <div key={i} className="break-keep">{renderTextWithHistory(clause)}</div>
              ))
            : fullText && (
                <div className="break-keep">{renderTextWithHistory(fullText)}</div>
              )
          }
        </div>
        {renderDialogs()}
      </div>
    );
  }

  let hasRenderedArticleHeader = false;

  return (
    <div id={id} data-article-id={articleId} className="mb-2 animate-fade-in rule-viewer-content font-['Pretendard'] relative group">
      {displayItems.map((item, index) => {
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
        let safeText = item.text !== null && item.text !== undefined ? String(item.text) : "";
        
        // 부칙인 경우, 별지/별표 문자열이 등장하면 그 이후의 모든 텍스트를 통째로 잘라냄 (잔여 찌꺼기 삭제)
        if (articleNumber < 9000 && title.includes('부칙')) {
           safeText = safeText.replace(/\s*[\[〔【<「『]\s*(별지|별표|서식|별첨)[\s\S]*$/i, '');
        }
        
        // 🚨 하드코딩 강제 삭제 킬스위치 (부칙 인식 실패 시에도 무조건 동작하도록 조건 밖으로 분리)
        const hardcodeMatchText = safeText.match(/「(?:<[^>]+>|\s|&nbsp;)*별(?:<[^>]+>|\s|&nbsp;)*표(?:<[^>]+>|\s|&nbsp;)*1(?:<[^>]+>|\s|&nbsp;)*」(?:<[^>]+>|\s|&nbsp;)*법(?:<[^>]+>|\s|&nbsp;)*인(?:<[^>]+>|\s|&nbsp;)*직(?:<[^>]+>|\s|&nbsp;)*원/);
        if (hardcodeMatchText && hardcodeMatchText.index !== undefined) {
           safeText = safeText.substring(0, hardcodeMatchText.index);
        }

        const plainItemText = safeText.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim();
        const numText = safeNum.trim();

        if (item.type === "paragraph" || item.type === "text") {
            if (!plainItemText && !numText) return null;
        }

        // Track paragraph hierarchy
        if (item.type === "paragraph" || /^[①-⑳]/.test(plainItemText) || /^[①-⑳]/.test(numText)) {
          const match = plainItemText.match(/^[①-⑳]/) || numText.match(/^[①-⑳]/);
          if (match) {
            const circleNums = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";
            const idx = circleNums.indexOf(match[0]);
            if (idx !== -1) {
               currentParagraphStr = `제${idx + 1}항`;
               currentItemStr = "";
               currentSubitemStr = "";
            }
          }
        }
        
        if (item.type === "item" || /^\d+\./.test(plainItemText) || /^\d+\./.test(numText)) {
          const match = plainItemText.match(/^(\d+)\./) || numText.match(/^(\d+)\./);
          if (match) {
             currentItemStr = `제${match[1]}호`;
             currentSubitemStr = "";
          }
        }

        if (item.type === "subitem" || /^[가-하]\./.test(plainItemText) || /^[가-하]\./.test(numText)) {
          const match = plainItemText.match(/^([가-하])\./) || numText.match(/^([가-하])\./);
          if (match) {
             currentSubitemStr = `${match[1]}목`;
          }
        }

        const handleSelectClick = (e: React.MouseEvent) => {
          
          e.stopPropagation();
          let numStr = `제${articleNumber}조`;
          
          if (item.type === 'article') {
             const m = plainItemText.match(/^제\d+조(?:의\d+)?/);
             if (m) numStr = m[0];
          } else {
             if (currentParagraphStr) numStr += ` ${currentParagraphStr}`;
             if (currentItemStr) numStr += ` ${currentItemStr}`;
             if (currentSubitemStr) numStr += ` ${currentSubitemStr}`;
          }

          const safeRuleName = title || document.title;
          if (window.confirm(`선택한 조문: [${safeRuleName}] ${numStr}\n이 조문을 인용으로 연결하시겠습니까?`)) {
             window.opener.postMessage({ type: 'RULE_SELECTED', title: safeRuleName, articleNum: numStr }, '*');
             window.close();
          }
        };

        const interactiveClass = "";
        const SelectBadge = () => {
          
          return (
            <div className="absolute top-1/2 -translate-y-1/2 right-2 hidden group-hover:flex bg-blue-600 text-white text-[11px] font-bold px-2 py-1 rounded shadow pointer-events-none items-center gap-1 z-10">
              ✅ 선택
            </div>
          );
        };

        const isSubsection = item.type === "text" && /^제\d+관/.test(safeText.trim());

        let showEditBtn = false;
        if (!hasRenderedEditBtn && item.type !== "chapter" && item.type !== "section" && !isSubsection) {
           showEditBtn = true;
           hasRenderedEditBtn = true;
        }

        if (item.type === "chapter" || item.type === "section" || isSubsection) {
          const isChapter = item.type === "chapter";
          if (index > 0 && displayItems[index - 1]?.type === item.type && displayItems[index - 1]?.text === item.text) return null;
          
          let titlePart = safeText.trim();
          let historyParts: string[] = [];
          
          const historyRegex = /([<(\[＜（](?:개정|제정|신설|삭제|본조신설|전문개정|전부개정|일부개정|단서신설|후단신설|단서삭제|장\s*변경|조\s*폐지|변경|폐지|표개정|조이동|조신설|항신설|호신설|목신설|표이동|본문이동|캠퍼스명칭변경|명칭변경|서식개정|서식신설|별표개정|별지개정|[가-힣\s,･]+개정|[가-힣\s,･]+신설|[가-힣\s,･]+이동|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?)(?:[^>\])＞）]*\d+[^>\])＞）]*|[\s]*)[>\])＞）])/g;
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
            let parsedTitle = "";
            
            const safeText = String(articleItem.text || "").trim();
            const plainText = safeText.replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, ' ').trim();
            const isAddendum = /^부\s*칙/.test(plainText) || plainText.replace(/\s+/g, "").startsWith("부칙") || (title && ["부칙", "부", "부 ", "칙", "칙 "].includes(title));
            const { historyDates, badgeType, badgeColor, badgeTitle } = getBadgeInfo(plainText, contentText);
            
            if (plainText.startsWith("(") && !/^\((삭제|개정|신설|전문개정|본조신설)/.test(plainText)) {
              const match = plainText.match(/^(\([^)]+\))(.*)/);
              if (match) {
                parsedTitle = match[1];
              }
            }

            const isFirstArticleHeader = !hasRenderedArticleHeader;
            hasRenderedArticleHeader = true;

            return (
              <div className={`mt-4 mb-0 flex items-start gap-2 pt-1 relative ${!isFirstArticleHeader ? 'w-full' : 'w-[calc(100%+52px)] -ml-[52px]'} ${interactiveClass}`} style={!isFirstArticleHeader ? { paddingLeft: '52px' } : undefined}>
                {showEditBtn && renderEditButton(true)}
                {onTogglePrintSelect && articleId && (
                  <div className="flex items-center mr-1 mt-0.5">
                    <input 
                      type="checkbox" 
                      checked={isSelectedForPrint} 
                      onChange={(e) => onTogglePrintSelect(articleId, e.target.checked)} 
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                )}
                {!hideBadge && !isAddendum && (
                  <div className="flex items-center gap-1 mt-0.5 z-10">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenHistory(historyDates); }}
                      title={badgeTitle}
                      className={`w-5 h-5 shrink-0 flex items-center justify-center rounded text-[11px] font-bold cursor-pointer transition-colors border ${badgeColor}`}
                    >
                      {badgeType}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePrintArticle(safeText); }}
                      title="해당 조문 인쇄하기"
                      className="w-5 h-5 shrink-0 flex items-center justify-center rounded text-[11px] font-bold cursor-pointer transition-colors border bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
                    >
                      인
                    </button>
                  </div>
                )}
                <div className={isFirstArticleHeader ? `flex-1 w-full group/text text-[16px] text-slate-800 leading-[1.7] ${(!hideBadge && !isAddendum) ? "" : "ml-[52px]"}` : `w-full text-[16px] text-slate-800 leading-[1.7] break-keep`}>
                  <div id={isFirstArticleHeader ? `toc-${safeNum}` : undefined} className={isFirstArticleHeader ? "w-full break-keep inline-block" : "w-full"}>
                    {isAddendum ? (
                      <>
                        {(() => {
                          let titlePart = title || "부칙";
                          if (["부", "부 ", "칙", "칙 "].includes(titlePart)) titlePart = "부칙";

                          let addendumBody = safeText;
                          if (titlePart && addendumBody.startsWith(titlePart)) {
                              addendumBody = addendumBody.substring(titlePart.length).trim();
                          } else {
                              addendumBody = addendumBody.replace(/^(?:부\s*칙\s*)+/, '').trim();
                              addendumBody = addendumBody.replace(/^칙\s*/, '').trim();
                              const titleDateMatch = (title || "").match(/^부\s*칙\s*(\([^)]+\))/);
                              if (titleDateMatch && addendumBody.startsWith(titleDateMatch[1])) {
                                  addendumBody = addendumBody.substring(titleDateMatch[1].length).trim();
                              }
                          }
                          const dateMatch = addendumBody.match(/^\(?([\d.\s]+)\.?\)?\s*/);
                          return (
                            <>
                              <span className="font-bold mr-1 text-slate-900">{titlePart}</span>
                              <span className="font-normal">{renderTextWithHistory(addendumBody)}</span>
                            </>
                          );
                        })()}
                      </>
                    ) : (
                      <>
                        {(() => {
                          let articleTitleOverride = parsedTitle;
                          let articleNumOverride = safeNum || "";
                          let actualBody = safeText;

                          if (articleNumOverride) {
                              const numMatch = articleNumOverride.match(/^(제\d+조(?:의\d+)?)\s*(\([^)]+\))$/);
                              if (numMatch) {
                                  articleNumOverride = numMatch[1];
                                  articleTitleOverride = numMatch[2] + (articleTitleOverride || "");
                              }
                              articleNumOverride = articleNumOverride.replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
                          }

                          if (articleTitleOverride) {
                              articleTitleOverride = articleTitleOverride.replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
                          }

                          if (parsedTitle) {
                             actualBody = actualBody.replace(parsedTitle, "");
                          }
                          actualBody = actualBody.replace(/^(?:\s|&nbsp;|<br\s*\/?>|<\/?p[^>]*>)+/gi, '').trim();

                          if (/^제\d+조/.test(plainText)) {
                            const match = plainText.match(/^(제\d+조(?:의|\s+)?\d*)(?:(?:\s|&nbsp;)*)[\[〔(（]([^()]*?(?:\([^()]*\)[^()]*?)*)[\]〕)）]([\s\S]*)/);
                            if (match) {
                               articleNumOverride = match[1].replace(/\s/g, '');
                               if (articleNumOverride.match(/^제\d+조\d+$/)) {
                                   articleNumOverride = articleNumOverride.replace(/조(\d+)$/, '조의$1');
                               }
                               articleTitleOverride = `(${match[2]})`;
                               const titlePart = plainText.substring(0, plainText.indexOf(match[3]));
                               const regexPattern = titlePart.split('').map(c => 
                                 c.trim() === '' ? '(?:\\s|&nbsp;|<[^>]+>)*' : c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:\\s|&nbsp;|<[^>]+>)*'
                               ).join('');
                               const remover = new RegExp('^(?:\\s|&nbsp;|<[^>]+>)*' + regexPattern, 'i');
                               actualBody = actualBody.replace(remover, '').trim();
                            } else {
                               const match2 = plainText.match(/^(제\d+조(?:의|\s+)?\d*)(?:(?:\s|&nbsp;)*)([\s\S]*)/);
                               if (match2) {
                                   articleNumOverride = match2[1].replace(/\s/g, '');
                                   if (articleNumOverride.match(/^제\d+조\d+$/)) {
                                       articleNumOverride = articleNumOverride.replace(/조(\d+)$/, '조의$1');
                                   }
                                   const titlePart = plainText.substring(0, plainText.indexOf(match2[2]));
                                   const regexPattern = titlePart.split('').map(c => 
                                     c.trim() === '' ? '(?:\\s|&nbsp;|<[^>]+>)*' : c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:\\s|&nbsp;|<[^>]+>)*'
                                   ).join('');
                                   const remover = new RegExp('^(?:\\s|&nbsp;|<[^>]+>)*' + regexPattern, 'i');
                                   actualBody = actualBody.replace(remover, '').trim();
                               }
                            }
                            // Clean actualBody again in case the match exposed a leading <br> or <p>
                            actualBody = actualBody.replace(/^(?:\s|&nbsp;|<br\s*\/?>|<\/?p[^>]*>)+/gi, '').trim();
                            // 조문 제목 바로 옆에 <개정 ...>이 있고, 본문(①항 등) 뒤에 또 <개정 ...>이 있는 경우 조문 제목 옆의 중복 연혁 제거
                            actualBody = actualBody.replace(/^([<(\[＜（]\s*개정[^>\])＞）]*[>\])＞）])\s*(?=[①-⑳][\s\S]*?[<(\[＜（]\s*개정)/i, '').trim();
                          }

                          return (
                            <>
                              <span className="font-bold text-[#000080]">{articleNumOverride}</span>
                              {articleTitleOverride && <span className="font-normal text-slate-800 ml-1 mr-1">{articleTitleOverride}</span>}
                              {actualBody && <> {formatGluedText(actualBody, true)}</>}
                            </>
                          );
                        })()}
                      </>
                    )}
                  </div>
                </div>
                
              </div>
            );
          })();

        } else if (item.type === "paragraph" || /^[①-⑳]/.test(plainItemText) || /^[①-⑳]/.test(numText)) {
          // 연혁 표기(예: 2008. 7. 16.)의 월/일이 호(1., 2.)로 오인되어 isGlued가 true가 되는 버그 완벽 방지!
          let decodedForGlued = String(item.text || "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&nbsp;/gi, ' ');
          decodedForGlued = decodedForGlued.replace(HISTORY_REGEX, "");
          const plainTextForGlued = decodedForGlued.replace(/<[^>]+>/g, '').replace(/\((?:삭제|개정|제정|신설|전문개정|전부개정|일부개정|본조신설|단서신설|후단신설|단서삭제|장\s*변경|조\s*폐지|변경|폐지|표개정|조이동|조신설|항신설|호신설|목신설|표이동|본문이동|캠퍼스명칭변경|명칭변경|서식개정|서식신설|별표개정|별지개정|[가-힣\s,･]+개정|[가-힣\s,･]+신설|[가-힣\s,･]+이동|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?)\s*[^)]*\)/gi, '').trim();
          const isGlued = /^제\d+조/.test(plainTextForGlued) || /(?<!\d+\.\s*)(?<!\d)(\d{1,2}\.)\s+(?=[^\d])/.test(plainTextForGlued) || /(?<!^|\s)[①-⑳]/.test(plainTextForGlued);
          if (isGlued) {
            return (
              <div key={index} className={`text-slate-800 text-[16px] leading-[1.7] w-full my-1.5 relative ${interactiveClass}`} style={{ paddingLeft: '52px' }}>
                {showEditBtn && renderEditButton(true)}
                <span className="font-normal mr-1">{safeNum}</span>
                {formatGluedText(safeText, false)}
                
              </div>
            );
          }
          return (
            <div key={index} className={`text-slate-800 text-[16px] leading-[1.7] pr-4 break-keep w-full relative ${interactiveClass}`} style={{ paddingLeft: '92px', textIndent: '-20px' }}>
              {showEditBtn && renderEditButton(true)}
              <span className="font-normal mr-1">{safeNum}</span>
              <span className="font-normal">{renderLinesWithIndentation(safeText)}</span>
              
            </div>
          );
        } else if (item.type === "item") {
          const isAddendum = isAddendumItem(safeText);

          return (
            <React.Fragment key={index}>
              <div className={`text-slate-800 text-[16px] leading-[1.7] pr-4 break-keep w-full relative ${interactiveClass}`} style={{ paddingLeft: isAddendum ? '72px' : '108px', textIndent: isAddendum ? '-20px' : '-16px' }}>
                {showEditBtn && renderEditButton(true)}
                <span className="font-normal mr-1">{safeNum}</span>
                <span className="font-normal">{renderLinesWithIndentation(safeText)}</span>
                
              </div>
            </React.Fragment>
          );
        } else if (item.type === "subitem") {
          return (
            <div key={index} className={`text-slate-800 text-[16px] leading-[1.7] pr-4 break-keep w-full ${interactiveClass}`} style={{ paddingLeft: '124px', textIndent: '-16px' }}>
              <span className="font-normal mr-1">{safeNum}</span>
              <span className="font-normal">{renderLinesWithIndentation(safeText)}</span>
              
            </div>
          );
        } else {
          const isAddendum = safeText.replace(/\s+/g, "").startsWith("부칙") || 
                             (title && ["부칙", "부", "부 ", "칙", "칙 "].includes(title));
          if (isAddendum) {
            // 부칙을 article 타입처럼 렌더링 (부칙 중복 방지, 연 아이콘 제거)
            let titlePart = title || "부칙";
            if (["부", "부 ", "칙", "칙 "].includes(titlePart)) titlePart = "부칙";

            let addendumBody = safeText;
            if (titlePart && addendumBody.startsWith(titlePart)) {
                addendumBody = addendumBody.substring(titlePart.length).trim();
            } else {
                addendumBody = addendumBody.replace(/^(?:부\s*칙\s*)+/, '').trim();
                addendumBody = addendumBody.replace(/^칙\s*/, '').trim();
                const titleDateMatch = (title || "").match(/^부\s*칙\s*(\([^)]+\))/);
                if (titleDateMatch && addendumBody.startsWith(titleDateMatch[1])) {
                    addendumBody = addendumBody.substring(titleDateMatch[1].length).trim();
                }
            }
            return (
              <div key={index} className={`mt-8 mb-0 flex items-start gap-2 pt-2 relative w-full ${interactiveClass}`} style={{ paddingLeft: '52px' }}>
                <div className="flex-1 w-full group/text text-[16px] text-slate-800 leading-[1.7]">
                  <div className="w-full break-keep inline-block">
                    <span className="font-bold mr-1 text-slate-900">{titlePart}</span>
                    {addendumBody && <span className="font-normal">{renderTextWithHistory(addendumBody)}</span>}
                  </div>
                </div>
                
              </div>
            );
          }
          const textToFormat = safeNum ? `${safeNum} ${safeText}` : safeText;
          return (
            <div key={index} className={`text-slate-800 text-[16px] leading-[1.7] w-full my-1.5 ${interactiveClass} relative`} style={{ paddingLeft: '52px' }}>
              {showEditBtn && renderEditButton(true)}
              {formatGluedText(textToFormat, false)}
            </div>
          );
        }
      })}

      {/* HTML 파일이 없는 텍스트 기반 별지 렌더링 (디자인 포맷팅 적용) */}
      {(() => {
        const groups: { title: string, id: string, items: any[] }[] = [];
        let currentGroup: { title: string, id: string, items: any[] } | null = null;

        for (let i = 0; i < textAttachments.length; i++) {
          const item = textAttachments[i];
          const textStr = String(item.text || "").trim();
          const isTitle = /^(?:\[|〔)(별지|별표|서식|별첨)/.test(textStr);
          
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
                      
                      let itemClass = "text-[16.5px] leading-[1.8] text-slate-800 break-keep";
                      
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

      {renderDialogs()}
    </div>
  );

  function renderDialogs() {
    return (
      <>
        <Dialog open={modalHistory !== null} onClose={() => setModalHistory(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ p: 0 }}>
          <div className="flex justify-between items-center bg-slate-50 border-b border-slate-200 px-4 py-3">
            <span className="text-[16px] font-bold text-[#0c3161] flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              [조항 연혁] {ruleTitle || ""} {articleNumber < 9000 ? `제${articleNumber}조` : "부칙"} {title && title !== "부칙" ? `(${title})` : ""}
            </span>
            <IconButton size="small" onClick={() => setModalHistory(null)} sx={{ p: 0.5 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent className="p-6 bg-white">
          <div className="text-[13.5px] font-['Pretendard'] text-slate-700 leading-relaxed font-medium mt-2">
            {modalHistory?.map((item: any, idx: number) => {
              if (!item) return null;
              if (typeof item === 'string') {
                return (
                  <div key={idx} className="mb-6 last:mb-0">
                    <div className="font-bold text-[#0c3161] mb-2 text-[15px] flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-600"></span>
                      {item}
                    </div>
                    <table className="w-full border-collapse border border-slate-300 text-[14px]">
                      <thead>
                        <tr>
                          <th className="bg-slate-100 border border-slate-300 px-4 py-2.5 text-center font-bold text-[#0c3161] w-1/2">변경 전 (이전 조문)</th>
                          <th className="bg-slate-100 border border-slate-300 px-4 py-2.5 text-center font-bold text-[#0c3161] w-1/2">변경 후 ({item})</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-slate-300 p-4 align-top bg-slate-50 text-slate-500 text-center py-8">
                            {item.includes("제정") || item.includes("신설") ? "(신설 조문)" : "(이전 판본 데이터 미구축)"}
                          </td>
                          <td className="border border-slate-300 p-4 align-top bg-white text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                            {contentText || "(본문 없음)"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              }
              if (item.isSimpleString) {
                return (
                  <div key={idx} className="mb-6 last:mb-0">
                    <div className="font-bold text-[#0c3161] mb-2 text-[15px] flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-600"></span>
                      {item.text}
                    </div>
                    <table className="w-full border-collapse border border-slate-300 text-[14px]">
                      <thead>
                        <tr>
                          <th className="bg-slate-100 border border-slate-300 px-4 py-2.5 text-center font-bold text-[#0c3161] w-1/2">변경 전 (이전 조문)</th>
                          <th className="bg-slate-100 border border-slate-300 px-4 py-2.5 text-center font-bold text-[#0c3161] w-1/2">변경 후 ({item.text})</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-slate-300 p-4 align-top bg-slate-50 text-slate-500 text-center py-8">
                            {item.text.includes("제정") || item.text.includes("신설") ? "(신설 조문)" : "(이전 판본 데이터 미구축)"}
                          </td>
                          <td className="border border-slate-300 p-4 align-top bg-white text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                            {contentText || "(본문 없음)"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              }
              return (
                <div key={idx} className="mb-6 last:mb-0">
                  <div className="font-bold text-[#0c3161] mb-2 text-[15px] flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-600"></span>
                    {item.afterVersion} ({new Date(item.afterDate).toLocaleDateString()} 시행)
                    {item.note && <span className="text-slate-500 font-normal text-[13px] ml-2">[사유: {item.note}]</span>}
                  </div>
                  <table className="w-full border-collapse border border-slate-300 text-[14px]">
                    <thead>
                      <tr>
                        <th className="bg-slate-100 border border-slate-300 px-4 py-2.5 text-center font-bold text-[#0c3161] w-1/2">변경 전 ({item.beforeVersion || '이전 조문'})</th>
                        <th className="bg-slate-100 border border-slate-300 px-4 py-2.5 text-center font-bold text-[#0c3161] w-1/2">변경 후 ({item.afterVersion || '개정 조문'})</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-300 p-4 align-top bg-slate-50 text-slate-600 line-through whitespace-pre-wrap leading-relaxed">
                          {item.beforeText || "(없음)"}
                        </td>
                        <td className="border border-slate-300 p-4 align-top bg-white text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                          {item.afterText || "(삭제됨)"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditing} onClose={() => !isSaving && setIsEditing(false)} maxWidth="md" fullWidth disableEnforceFocus disableRestoreFocus>
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
          <div className="space-y-3 bg-white p-4 border border-slate-200 rounded-lg shadow-inner">
            {editHtml !== null ? (
               <JoditEditor
                  value={editHtml}
                  config={joditConfig}
                  onBlur={(newContent) => setEditHtml(newContent)}
                  onChange={() => {}}
                />
            ) : (
              editItems.map((item, idx) => (
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
              ))
            )}
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
              type="button"
              className="px-4 py-2 border border-slate-300 text-slate-600 bg-white rounded font-bold text-sm hover:bg-slate-50 transition-colors"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              취소
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-[#0c3161] text-white rounded font-bold text-sm hover:bg-blue-800 flex items-center gap-2 transition-colors shadow-sm"
              onClick={async (e) => {
                e.preventDefault();
                if (!articleId) return;
                setIsSaving(true);
                try {
                  let bodyPayload: any = {};
                  if (editHtml !== null) {
                    if (originalHasHtml) {
                      bodyPayload = {
                        contentText: contentText || "",
                        contentJson: contentJson || {},
                        contentHtml: editHtml
                      };
                    } else {
                      let newText = editHtml;
                      newText = newText.replace(/<\/p>\s*<p[^>]*>/gi, '\n');
                      newText = newText.replace(/<\/?p[^>]*>/gi, '\n');
                      newText = newText.replace(/<br\s*\/?>/gi, '\n');
                      newText = newText.replace(/<\/div>\s*<div[^>]*>/gi, '\n');
                      newText = newText.replace(/<\/?div[^>]*>/gi, '\n');
                      newText = newText.replace(/<[^>]+>/g, '');
                      newText = newText.replace(/\n\s*\n/g, '\n').trim();

                      const newItems = newText.split('\n').filter(line => line.trim()).map(line => {
                        let num = "";
                        let text = line.trim();
                        const match = text.match(/^([①-⑳\d]+[.)]?)\s*(.*)/);
                        if (match) {
                          num = match[1];
                          text = match[2].trim();
                        }
                        return { type: 'text', num, text };
                      });

                      bodyPayload = {
                        contentText: newText,
                        contentHtml: null,
                        contentJson: newItems
                      };
                    }
                  } else {
                    const newText = editItems.map(i => {
                      if (!i.num) return i.text;
                      const trimmedText = (i.text || "").trim();
                      if (trimmedText.startsWith(i.num)) return i.text;
                      return `${i.num} ${i.text}`;
                    }).join('\n');
                    bodyPayload = {
                      contentText: newText,
                      contentJson: editItems
                    };
                  }

                  const res = await fetch(`/api/admin/articles/${articleId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bodyPayload)
                  });
                  if (!res.ok) throw new Error('저장 실패');
                  alert('성공적으로 수정되었습니다.');
                  setIsEditing(false);
                  window.dispatchEvent(new CustomEvent('rule-updated'));
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
      </>
    );
  }
}

// Trigger deploy
