import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { diffWords } from 'diff';

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
}

const convertCircledNum = (char: string) => {
  const code = char.charCodeAt(0);
  if (code >= 0x2460 && code <= 0x2473) return code - 0x245F;
  if (code >= 0x3251 && code <= 0x325F) return code - 0x3250 + 20;
  return 1;
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
}: ArticleRendererProps) {
  const isAddendumArticle =
    title === "부칙" ||
    (title || "").replace(/\s+/g, "").startsWith("부칙") ||
    chapter === "부칙" ||
    (chapter || "").replace(/\s+/g, "").startsWith("부칙") ||
    // title/chapter가 없어도 contentText가 부칙으로 시작하는 경우 (예: 1-0-1 정관)
    (!title && !chapter && /^부\s*칙/.test((contentText || "").trim()));

  const hideBadge = hideHistory || isAddendumArticle;
  const [modalHistory, setModalHistory] = useState<any[] | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editItems, setEditItems] = useState<ContentItem[]>([]);
  const [editHtml, setEditHtml] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editHistory, setEditHistory] = useState<{ id: string, createdAt: string, beforeText: string }[]>([]);

  const renderEditButton = (isItemRelative = false) => {
    if (!isAdmin) return null;
    if (isAddendumArticle) return null;
    return (
      <button 
        onClick={() => {
          if (window.confirm("본 수정기능은 규정개정이 아닌 단순오타만 수정이 가능합니다.\n개정이 필요한 경우 입안편집기를 이용하시기 바랍니다.")) {
            if (contentHtml && contentHtml.trim().length > 0) {
              setEditHtml(contentHtml);
              setEditItems([]);
            } else {
              setEditHtml(null);
              setEditItems(JSON.parse(JSON.stringify(items)));
            }
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
       const formMatch = cleanHtml.match(/(\[|〔|【|<)\s*(별지|별표|서식|별첨)\s*(제\d+호|[0-9]+)?.*?(\]|〕|】|>)/i);
       if (formMatch && formMatch.index !== undefined) {
          const cutIdx = formMatch.index;
          const remainder = cleanHtml.substring(cutIdx);
          if (remainder.toLowerCase().includes('<table')) {
             cleanHtml = cleanHtml.substring(0, cutIdx);
          }
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
      // 1. Addendum Keywords: Break unconditionally, even if there are HTML tags or zero-width spaces inside
      cleanHtml = cleanHtml.replace(/(\([^)]*(?:시행일|경과조치|적용례|적용범위|준용|폐지|예외|단서|특례|임기|존속기간|관련|시행|적용)[^)]*\))/g, (match, paren, offset, str) => {
        const before = str.slice(0, offset);
        if (before.match(/(?:<br\s*\/?>|<\/p>|<p>)\s*$/i)) return match;
        if (before.match(/\d+(?:의\d+)?\.\s*$/)) return match;
        if (before.match(/제\d+조의?\d*\s*$/)) return match;
        if (before.match(/\d\s*$/)) return match;
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

    return (
      <div id={id} className="animate-fade-in rule-viewer-content font-['Pretendard'] w-full relative group">
        {renderEditButton()}
        {articleNumber >= 9000 && (
          <div className="mt-16 mb-8 border-t-2 border-slate-300 pt-10 text-left w-full">
            <span className="text-[20px] font-black text-[#000080] tracking-tight">{title}</span>
          </div>
        )}
        <div 
          className={`mb-4 ql-editor ${wrapperClass} px-0 py-2 w-full`}
          dangerouslySetInnerHTML={{ __html: cleanHtml }}
        />
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
    for (let i = 0; i < Math.min(items.length, 3); i++) {
        if (items[i]) {
            const textStr = String(items[i].text || "").trim();
            if (textStr.startsWith(expectedTitleStart) || (articleNumber >= 8000 && textStr.replace(/\s+/g, '').startsWith(fullTitle.replace(/\s+/g, '')))) {
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
        items.unshift({ type: "text", num: "", text: fullTitle });
      }
    }
  }

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

  const HISTORY_REGEX = /([<(\[＜（](?:개정|제정|신설|삭제|본조신설|전문개정|단서신설|후단신설|장\s*변경|조\s*폐지|변경|폐지|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?)(?:[^>\])＞）]*\d+[^>\])＞）]*|[\s]*)[>\])＞）])/gi;

  const normalizeHistoryDate = (str: string) => {
    let inner = str.replace(/^[<(\[]|[)>\]]$/g, '').trim();
    let parts = inner.split(',').map(p => p.trim());
    let lastAction = '';
    let normParts = parts.map(part => {
      let match = part.match(/^(개정|제정|신설|삭제|본조신설|전문개정|단서신설|후단신설|장\s*변경|조\s*폐지|변경|폐지)?\s*(.*)$/);
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

  const renderTextWithHistory = (text: string) => {
    // DB에 &lt;table&gt; 과 같이 이스케이프되어 저장된 경우를 대비해 디코딩
    let decodedText = text
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&nbsp;/g, " ")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/설치.{0,2}운영.{0,2}폐지/gu, '설치·운영·폐지');

    // 만약 테이블 태그가 없고 단순히 <p>나 </p> 등의 태그만 텍스트로 들어가 있다면 이를 정화해줍니다.
    if (!/<table/i.test(decodedText)) {
      decodedText = decodedText.replace(/<\/?[pP](?:\s[^>]*)?>/g, "");
    }

    if (hideHistory) {
      // 연혁 숨기기
      decodedText = decodedText.replace(HISTORY_REGEX, "");
    }
    
    // 연혁 표시: <개정 ...> 부분을 파란색으로 렌더링하기 위한 문자열 준비
    let htmlText = decodedText.replace(
      HISTORY_REGEX,
      (match) => `<span class="text-sky-700 font-medium text-[13px] ml-1">${normalizeHistoryDate(match).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`
    );


    
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
      return (
        <div 
          className="html-table-wrapper block w-full overflow-x-auto html-content-inline"
          dangerouslySetInnerHTML={{ __html: htmlText }} 
        />
      );
    }

    const parts = decodedText.split(/(\[cite\s+rule="[^"]*"\s+article="[^"]*"(?:\s+url="[^"]*")?\][\s\S]*?\[\/cite\]|\[nocite\][\s\S]*?\[\/nocite\]|[<(](?:개정|제정|신설|삭제|본조신설|전문개정|단서신설|후단신설|변경|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?)[^>)]*[>)])/gi);
    return parts.map((part, i) => {
      if (/^[<(](?:개정|제정|신설|삭제|본조신설|전문개정|단서신설|후단신설|변경|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?)/.test(part)) {
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
      
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  const getBadgeInfo = (text: string) => {
    let historyDates: string[] = [];
    const datesMatches = text.match(/\((?:삭제|개정|신설|전문개정|본조신설|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?)\s*[^)]*\)/g);
    if (datesMatches) {
      datesMatches.forEach(match => {
        const cleaned = match.replace(/[()]/g, '').trim();
        historyDates.push(cleaned);
      });
    }
    if (text.includes("<개정")) {
      const match = text.match(/<개정(.*?)>/);
      if (match) historyDates.push(`개정 ${match[1].trim()}`);
    }
    const badgeType = historyDates.some(h => h.includes("개정")) ? "개" : "연";
    const badgeColor = badgeType === "개" ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100" : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100";
    return { historyDates, badgeType, badgeColor };
  };

  // 파서 오류로 하나로 뭉쳐진 장/조/호 배열 텍스트를 정규식으로 동적 분할 및 포맷팅해주는 헬퍼
  const formatGluedText = (text: string, isArticleBody: boolean = false): React.ReactNode => {
    if (/<table/i.test(text)) {
      const parts = text.split(/(<table[\s\S]*?<\/table>)/i);
      if (parts.length > 1) {
        return (
          <>
            {parts.map((part, idx) => {
              if (/<table/i.test(part)) {
                return (
                  <div key={`table-part-${idx}`} className="html-table-wrapper block w-full overflow-x-auto my-4" dangerouslySetInnerHTML={{ __html: part }} />
                );
              }
              if (!part.trim()) return null;
              return <React.Fragment key={`text-part-${idx}`}>{formatGluedText(part, isArticleBody)}</React.Fragment>;
            })}
          </>
        );
      }
    }

    if (/<tr|<td|<th/i.test(text)) {
       return <div className="html-table-wrapper block w-full overflow-x-auto" dangerouslySetInnerHTML={{ __html: text }} />;
    }

    if (text.length < 50 && !/^\s*제\d+(?:조|장|관|절)/.test(text)) {
        if (!hideHistory && (text.includes("제정") || text.includes("개정") || text.includes("시행")) && /^\s*[\[〔]/.test(text)) {
             return <span className="text-[14px] text-blue-600 font-medium">[{text.replace(/[\[\]〔〕]/g, '')}]</span>;
        }
        return <span className={isArticleBody ? "font-normal text-slate-800" : ""}>{renderTextWithHistory(text)}</span>;
    }

    let formatted = text
      .replace(/([①-⑮])/g, (match, p1, offset, string) => {
        const before = string.slice(0, offset);
        if (/(?:제|\(|,|및|또는|와|과|이나|나)\s*$/.test(before)) return match;
        if (offset === 0 || before.endsWith('\n')) return match;
        return '\n' + match;
      })
      .replace(/(?<!\d+(?:의\d+)?\.\s*)(?<!\d)(\d{1,2}(?:의\d+)?\.)\s+(?=[^\d])/g, (match, p1, offset, string) => {
        const before = string.slice(0, offset);
        if (offset === 0 || before.endsWith('\n')) return match;
        return '\n' + p1 + ' ';
      })
      .replace(/(^|\s)([가-하]\.)[ \t]+/g, (match, p1, p2, offset, string) => {
        const before = string.slice(0, offset + p1.length);
        if (offset === 0 || before.endsWith('\n')) return match;
        return p1 + '\n' + p2 + ' ';
      })
      .replace(/(제\d+조의?\d*\s*[\[〔(（][^\]〕)）]+[\]〕)）])\s*\n([①-⑮])/g, '$1 $2')
      .replace(/((?<![『「])제\d+조의?\d*\s*(?:\[(?![\s\S]*?\[\/cite\])|[〔(（])[^\]〕)）]+[\]〕)）])/g, '\n\n$1')
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

    // 1. Addendum Keywords: Break unconditionally
    formatted = formatted.replace(/(\([^)]*(?:시행일|경과조치|적용례|적용범위|준용|폐지|예외|단서|특례|임기|존속기간|관련|시행|적용)[^)]*\))/g, (match, paren, offset, str) => {
      const before = str.slice(0, offset);
      if (before.match(/\n\s*$/)) return match;
      if (before.match(/\d+(?:의\d+)?\.\s*$/)) return match;
      if (before.match(/제\d+조의?\d*\s*$/)) return match;
      if (before.match(/\d\s*$/)) return match;
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

    return (
      <>
        {lines.map((trimmedLine, idx) => {
          let trimmed = trimmedLine.replace(/__CITATION_(\d+)__/g, (_, i) => hiddenCitations[parseInt(i, 10)] || '');
          let lineClass = "break-keep text-slate-800";
          let isInline = (idx === 0 && isArticleBody);
          let currentPath = baseArticlePath;

          if (/^[①-⑮]/.test(trimmed)) {
             const numMatch = trimmed.match(/^([①-⑮])\s*(.*)/);
             if (numMatch) {
               curHang = `제${convertCircledNum(numMatch[1])}항`;
               curHo = ""; curMok = "";
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
                  <div key={`glued-${idx}`} className={`w-full break-keep text-slate-800 py-0.5 ${interactiveClass}`} style={{ paddingLeft: '20px', textIndent: '-20px' }}>
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
               curMok = "";
               currentPath = `${baseArticlePath} ${curHang} ${curHo}`.replace(/\s+/g, ' ').trim();
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
                  <div key={`glued-${idx}`} className={`w-full break-keep text-slate-800 py-0.5 ${interactiveClass}`} style={{ paddingLeft: '36px', textIndent: '-16px' }}>
                     <span className="font-normal mr-1">{numMatch[1]}</span>
                     <span className="font-normal">{renderTextWithHistory(numMatch[2])}</span>
                     
                  </div>
               );
             }
             lineClass += " ml-2 block";
          } else if (/^[가-하]\./.test(trimmed)) {
             const numMatch = trimmed.match(/^([가-하]\.)\s*(.*)/);
             if (numMatch) {
               curMok = `${numMatch[1].replace('.', '')}목`;
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
                  <div key={`glued-${idx}`} className={`w-full break-keep text-slate-800 py-0.5 ${interactiveClass}`} style={{ paddingLeft: '52px', textIndent: '-16px' }}>
                     <span className="font-normal mr-1">{numMatch[1]}</span>
                     <span className="font-normal">{renderTextWithHistory(numMatch[2])}</span>
                     
                  </div>
               );
             }
             lineClass += " ml-4 block";
          } else if (/^제\d+조/.test(trimmed) && !/[『「]$/.test(trimmed.slice(0, trimmed.search(/제\d+조/)))) {
             const match2 = trimmed.match(/^(제\d+조(?:의|\s+)?\d*)\s*(.*)/);
             if (match2) {
                 let articleNum = match2[1].replace(/\s/g, '');
                 if (articleNum.match(/^제\d+조\d+$/)) {
                     articleNum = articleNum.replace(/조(\d+)$/, '조의$1');
                 }
                 const body = match2[2].trim();
                 const fullTitle = articleNum;
                 const { historyDates, badgeType, badgeColor } = getBadgeInfo(trimmed);
                 return (
                    <div key={`glued-${idx}`} id={`toc-${articleNum}`} className="mt-4 mb-0 flex items-start gap-2 pt-1 relative w-full group/text">
                       {renderEditButton(true)}
                       {!hideBadge && (
                         <button 
                           onClick={() => handleOpenHistory(historyDates)}
                           className={`w-5 h-5 shrink-0 flex items-center justify-center rounded text-[11px] font-bold mt-0.5 cursor-pointer transition-colors border ${badgeColor}`}
                         >
                           {badgeType}
                         </button>
                       )}
                       <div className="flex-1 w-full group text-[16px] text-slate-800 leading-[1.7]">
                          <div className="w-full break-keep inline-block">
                             <span className="font-bold mr-1 text-[#000080]">{fullTitle}</span>
                             {body && <span className="font-normal text-slate-800">{renderTextWithHistory(body)}</span>}
                          </div>
                       </div>
                    </div>
                 );
             } else {
                 lineClass += " mt-4 mb-2 text-[16px] font-bold text-[#000080] block";
             }
          } else if (/^부\s*칙/.test(trimmed)) {
             const match = trimmed.match(/^(?:부\s*칙\s*)+/);
             if (match) {
                 const titlePart = title || "부칙";
                 let body = trimmed;
                 if (title && body.startsWith(title.trim())) {
                     body = body.substring(title.trim().length).trim();
                 } else {
                     body = body.replace(/^(?:부\s*칙\s*)+/, '').trim();
                     const titleDateMatch = (title || "").match(/^부\s*칙\s*(\([^)]+\))/);
                     if (titleDateMatch && body.startsWith(titleDateMatch[1])) {
                         body = body.substring(titleDateMatch[1].length).trim();
                     }
                 }
                 const { historyDates, badgeType, badgeColor } = getBadgeInfo(trimmed);
                 return (
                    <div key={`glued-${idx}`} className="mt-4 mb-0 flex items-start gap-2 pt-1 relative w-full">
                       {!hideBadge && (
                         <button 
                           onClick={() => handleOpenHistory(historyDates)}
                           className={`w-5 h-5 shrink-0 flex items-center justify-center rounded text-[11px] font-bold mt-0.5 cursor-pointer transition-colors border ${badgeColor}`}
                         >
                           {badgeType}
                         </button>
                       )}
                       <div className="flex-1 w-full group text-[16px] text-slate-800 leading-[1.7]">
                          <div className="w-full break-keep inline-block">
                             <span className="font-bold mr-1 text-[#000080]">{titlePart}</span>
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

  let displayItems = [...items];
  for (let i = 0; i < displayItems.length - 1; i++) {
      const curr = displayItems[i];
      const next = displayItems[i+1];
      if (curr && (curr.type === "article" || curr.type === "paragraph") && next && (next.type === "paragraph" || next.type === "text")) {
          const currTextPlain = String(curr.text || "").replace(/<[^>]+>/g, '').trim();
          const nextTextPlain = String(next.text || "").replace(/<[^>]+>/g, '').trim();
          if (currTextPlain === "" || /^\([^)]+\)$/.test(currTextPlain) || /^제\d+조/.test(currTextPlain)) {
              if (!/^제\d+조/.test(nextTextPlain)) {
                  displayItems[i] = { ...curr, text: (curr.text ? curr.text + " " : "") + (next.text || "") };
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
    // ── 1. 모든 아이템에서 텍스트 수집
    const rawLines: string[] = [];
    for (const item of displayItems) {
      if (!item) continue;
      let raw = String(item.text || "").trim();
      if (!raw) continue;
      raw = raw.replace(/^(?:부\s*칙\s*)+/, "").trim();
      if (raw) rawLines.push(raw);
    }

    // ── 2. 전체 텍스트 결합 (비어있으면 contentText fallback)
    let fullText = rawLines.join("\n");
    if (!fullText && contentText) {
      fullText = contentText.replace(/^(?:부\s*칙\s*)+/, "").trim();
    }

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
    if (!headerAnnotation && title && title !== "부칙" && !/^부\s*칙$/.test(title.trim())) {
      const titleRest = title.replace(/^부\s*칙\s*/, "").trim();
      if (titleRest) {
        let normalized = titleRest;
        if (normalized.startsWith("(")) {
          normalized = "<" + normalized.substring(1, normalized.length - 1) + ">";
        }
        normalized = normalized.replace(/(\d{1,2})([>)])$/, "$1.$2");
        headerAnnotation = normalized;
      }
    }

    // 중복되는 부칙/조 제목 접두사 제거 (데이터베이스에 "부칙제1조(시행일)\n제1조(시행일)" 같이 중복 저장된 경우)
    const lines = fullText.split('\n');
    const newLines: string[] = [];
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
    const cleanedClauses = clauses.map(c =>
      c.replace(/\s*([\[〔【<])\s*(\ubcc4지|\ubcc4표|\uc11c식|\ubcc4첨).*$/, "").trim()
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
        {/* 편집 다이얼로그 */}
        <Dialog open={isEditing} onClose={() => !isSaving && setIsEditing(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ p: 0 }}>
            <div className="flex justify-between items-center bg-slate-50 border-b border-slate-200 px-4 py-3">
              <span className="font-bold text-[#0c3161]">부칙 단순 수정</span>
              <IconButton size="small" onClick={() => !isSaving && setIsEditing(false)} sx={{ p: 0.5 }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </div>
          </DialogTitle>
          <DialogContent className="p-6 bg-slate-50">
            <div className="space-y-3 bg-white p-4 border border-slate-200 rounded-lg shadow-inner max-h-[50vh] overflow-y-auto scrollbar">
              {editItems.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  {item.num && <span className="font-bold shrink-0 mt-2.5 text-[#0c3161] whitespace-nowrap min-w-[1.5rem]">{item.num}</span>}
                  <textarea
                    className="w-full border border-slate-300 rounded p-2.5 text-[14px] text-slate-800 focus:outline-none focus:border-blue-500 min-h-[60px] resize-y"
                    value={item.text}
                    onChange={(e) => { const n = [...editItems]; n[idx].text = e.target.value; setEditItems(n); }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="px-4 py-2 border border-slate-300 text-slate-600 bg-white rounded font-bold text-sm" onClick={() => setIsEditing(false)} disabled={isSaving}>취소</button>
              <button type="button" className="px-4 py-2 bg-[#0c3161] text-white rounded font-bold text-sm" onClick={async () => {
                if (!articleId) return;
                setIsSaving(true);
                try {
                  const newText = editItems.map(i => (i.num ? `${i.num} ${i.text}` : i.text)).join('\n');
                  const res = await fetch(`/api/admin/articles/${articleId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contentText: newText, contentJson: editItems }) });
                  if (!res.ok) throw new Error('저장 실패');
                  alert('수정 완료');
                  setIsEditing(false);
                  window.dispatchEvent(new CustomEvent('rule-updated'));
                } catch { alert('오류 발생'); } finally { setIsSaving(false); }
              }} disabled={isSaving}>{isSaving ? '저장 중...' : '수정 완료'}</button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

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
        
        // 부칙인 경우, 텍스트 맨 끝에 딸려온 별지/별표 문자열 제거
        if (articleNumber < 9000 && title.includes('부칙')) {
           safeText = safeText.replace(/\s*(\[|〔|【|<)\s*(별지|별표|서식|별첨)\s*(제\d+호|[0-9]+)?.*?(\]|〕|】|>)\s*$/i, '');
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
          
          const historyRegex = /([<(\[＜（](?:개정|제정|신설|삭제|전문개정|본조신설|장\s*변경|조\s*폐지|변경|폐지|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?)(?:[^>\])＞）]*\d+[^>\])＞）]*|[\s]*)[>\])＞）])/g;
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
            const isAddendum = /^부\s*칙/.test(plainText) || plainText.replace(/\s+/g, "").startsWith("부칙");
            const { historyDates, badgeType, badgeColor } = getBadgeInfo(plainText);
            
            if (plainText.startsWith("(") && !/^\((삭제|개정|신설|전문개정|본조신설)/.test(plainText)) {
              const match = plainText.match(/^(\([^)]+\))(.*)/);
              if (match) {
                parsedTitle = match[1];
              }
            }

            return (
              <div className={`mt-4 mb-0 flex items-start gap-2 pt-1 relative w-full ${interactiveClass}`}>
                {showEditBtn && renderEditButton(true)}
                {!hideBadge && !isAddendum && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenHistory(historyDates); }}
                    className={`w-5 h-5 shrink-0 flex items-center justify-center rounded text-[11px] font-bold mt-0.5 cursor-pointer transition-colors border ${badgeColor}`}
                  >
                    {badgeType}
                  </button>
                )}
                <div className={`flex-1 w-full group/text text-[16px] text-slate-800 leading-[1.7] ${(!hideBadge && !isAddendum) ? "" : "ml-[28px]"}`}>
                  <div id={`toc-${safeNum}`} className="w-full break-keep inline-block">
                    {isAddendum ? (
                      <>
                        {(() => {
                          let addendumBody = plainText;
                          if (title && addendumBody.startsWith(title.trim())) {
                              addendumBody = addendumBody.substring(title.trim().length).trim();
                          } else {
                              addendumBody = addendumBody.replace(/^(?:부\s*칙\s*)+/, '').trim();
                              const titleDateMatch = (title || "").match(/^부\s*칙\s*(\([^)]+\))/);
                              if (titleDateMatch && addendumBody.startsWith(titleDateMatch[1])) {
                                  addendumBody = addendumBody.substring(titleDateMatch[1].length).trim();
                              }
                          }
                          const dateMatch = addendumBody.match(/^\(?([\d.\s]+)\.?\)?\s*/);
                          return (
                            <>
                              <span className="font-bold mr-1 text-[#000080]">{title || "부칙"}</span>
                              <span className="font-normal">{renderTextWithHistory(addendumBody)}</span>
                            </>
                          );
                        })()}
                      </>
                    ) : (
                      <>
                        {(() => {
                          let articleTitleOverride = parsedTitle;
                          let articleNumOverride = safeNum;
                          let actualBody = plainText.replace(parsedTitle, "").trim();

                          if (!safeNum && /^제\d+조/.test(plainText)) {
                            const match = plainText.match(/^(제\d+조(?:의|\s+)?\d*)\s*[\[〔(（]([^\]〕)）]+)[\]〕)）](.*)/);
                            if (match) {
                               articleNumOverride = match[1].replace(/\s/g, '');
                               if (articleNumOverride.match(/^제\d+조\d+$/)) {
                                   articleNumOverride = articleNumOverride.replace(/조(\d+)$/, '조의$1');
                               }
                               articleTitleOverride = `(${match[2]})`;
                               actualBody = match[3].trim();
                            } else {
                               const match2 = plainText.match(/^(제\d+조(?:의|\s+)?\d*)\s*(.*)/);
                               if (match2) {
                                   articleNumOverride = match2[1].replace(/\s/g, '');
                                   if (articleNumOverride.match(/^제\d+조\d+$/)) {
                                       articleNumOverride = articleNumOverride.replace(/조(\d+)$/, '조의$1');
                                   }
                                   actualBody = match2[2].trim();
                               }
                            }
                          }

                          return (
                            <>
                              <span className="font-bold mr-1 text-[#000080]">{articleNumOverride}{articleTitleOverride}</span>
                              {actualBody && <span className="font-normal">{renderTextWithHistory(actualBody)}</span>}
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

        } else if (item.type === "paragraph") {
          const plainText = String(item.text || "").replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, ' ').trim();
          const isGlued = /^제\d+조/.test(plainText) || /(?<!\d+\.\s*)(?<!\d)(\d{1,2}\.)\s+(?=[^\d])/.test(plainText) || /(?<!^|\s)[①-⑮]/.test(plainText);
          if (isGlued) {
            const isTopLevelArticle = /^제\d+조/.test(plainText);
            return (
              <div key={index} className={`text-slate-800 text-[16px] leading-[1.7] w-full my-1.5 ${isTopLevelArticle ? '' : 'pl-[1.25rem]'} relative ${interactiveClass}`}>
                <span className="font-normal mr-1">{safeNum}</span>
                {formatGluedText(plainText, false)}
                
              </div>
            );
          }
          return (
            <div key={index} className={`text-slate-800 text-[16px] leading-[1.7] pr-4 break-keep w-full relative ${interactiveClass}`} style={{ paddingLeft: '20px', textIndent: '-20px' }}>
              {showEditBtn && renderEditButton(true)}
              <span className="font-normal mr-1">{safeNum}</span>
              <span className="font-normal">{renderTextWithHistory(safeText)}</span>
              
            </div>
          );
        } else if (item.type === "item") {
          const isAddendum = isAddendumItem(safeText);

          return (
            <React.Fragment key={index}>
              <div className={`text-slate-800 text-[16px] leading-[1.7] pr-4 break-keep w-full relative ${interactiveClass}`} style={{ paddingLeft: isAddendum ? '20px' : '36px', textIndent: isAddendum ? '-20px' : '-16px' }}>
                {showEditBtn && renderEditButton(true)}
                <span className="font-normal mr-1">{safeNum}</span>
                <span className="font-normal">{renderTextWithHistory(safeText)}</span>
                
              </div>
            </React.Fragment>
          );
        } else if (item.type === "subitem") {
          return (
            <div key={index} className={`text-slate-800 text-[16px] leading-[1.7] pr-4 break-keep w-full ${interactiveClass}`} style={{ paddingLeft: '52px', textIndent: '-16px' }}>
              <span className="font-normal mr-1">{safeNum}</span>
              <span className="font-normal">{renderTextWithHistory(safeText)}</span>
              
            </div>
          );
        } else {
          const isAddendum = safeText.replace(/\s+/g, "").startsWith("부칙");
          if (isAddendum) {
            // 부칙을 article 타입처럼 렌더링 (부칙 중복 방지, 연 아이콘 제거)
            let addendumBody = safeText;
            if (title && addendumBody.startsWith(title.trim())) {
                addendumBody = addendumBody.substring(title.trim().length).trim();
            } else {
                addendumBody = addendumBody.replace(/^(?:부\s*칙\s*)+/, '').trim();
                const titleDateMatch = (title || "").match(/^부\s*칙\s*(\([^)]+\))/);
                if (titleDateMatch && addendumBody.startsWith(titleDateMatch[1])) {
                    addendumBody = addendumBody.substring(titleDateMatch[1].length).trim();
                }
            }
            return (
              <div key={index} className={`mt-8 mb-0 flex items-start gap-2 pt-2 relative w-full ${interactiveClass}`}>
                <div className="flex-1 w-full group/text text-[16px] text-slate-800 leading-[1.7]">
                  <div className="w-full break-keep inline-block">
                    <span className="font-bold mr-1 text-[#000080]">{title || "부칙"}</span>
                    {addendumBody && <span className="font-normal">{renderTextWithHistory(addendumBody)}</span>}
                  </div>
                </div>
                
              </div>
            );
          }
          const isGluedArticle = /^\s*제\d+(?:조|장|관|절)/.test(safeText);
          return (
            <div key={index} className={`text-slate-800 text-[16px] leading-[1.7] w-full ${isGluedArticle ? '' : 'pl-[1.25rem]'} my-1.5 ${interactiveClass}`}>
              {formatGluedText(safeText, false)}
              
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
            {editHtml !== null ? (
               <textarea
                  className="w-full border border-slate-300 rounded p-2.5 text-[14px] text-slate-800 focus:outline-none focus:border-blue-500 min-h-[300px] resize-y shadow-sm transition-colors focus:bg-blue-50/20 leading-relaxed font-mono"
                  value={editHtml}
                  onChange={(e) => setEditHtml(e.target.value)}
                  placeholder="HTML 코드를 수정하세요"
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
                    bodyPayload = {
                      contentText: contentText || "",
                      contentJson: contentJson || {},
                      contentHtml: editHtml
                    };
                  } else {
                    const newText = editItems.map(i => {
                      if (i.type === 'article' || i.type === 'text') return i.text;
                      if (i.type === 'paragraph') return i.num ? `${i.num} ${i.text}` : i.text;
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
    </div>
  );
}
