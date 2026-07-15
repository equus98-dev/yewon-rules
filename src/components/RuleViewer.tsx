"use client";
import { compareAttachmentNames } from '@/lib/utils';

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { CircularProgress, Typography } from "@mui/material";
import ArticleRenderer from "./ArticleRenderer";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import HistoryIcon from "@mui/icons-material/History";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import ArticleIcon from "@mui/icons-material/Article";
import InfoIcon from "@mui/icons-material/Info";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import LaunchIcon from "@mui/icons-material/Launch";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PrintIcon from "@mui/icons-material/Print";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";


interface RuleViewerProps {
  ruleId: string;
  isAdmin?: boolean;
}

class RuleViewerErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-red-600 bg-red-50 h-full overflow-auto">
          <h2 className="text-xl font-bold mb-4">RuleViewer 렌더링 중 치명적 오류 발생!</h2>
          <pre className="text-sm bg-white p-4 border border-red-200 rounded whitespace-pre-wrap">{this.state.error?.toString()}</pre>
          <pre className="text-xs bg-white p-4 border border-red-200 rounded mt-2 overflow-x-auto">{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const getRevisionTypeName = (type: string | undefined | null) => {
  if (!type) return "개정";
  switch(type) {
    case "ENACTMENT": return "제정";
    case "AMENDMENT": return "일부개정";
    case "TOTAL_AMENDMENT": return "전부개정";
    case "ABOLITION": return "폐지";
    default: return type;
  }
};

const isAddendumArticle = (a: any) => {
  if (!a) return false;
  const title = a.title || "";
  const chapter = a.chapter || "";
  const contentText = a.contentText || "";
  return (
    ["부칙", "부", "칙", "부 ", "칙 "].includes(title) ||
    title.replace(/\s+/g, "").startsWith("부칙") ||
    chapter === "부칙" ||
    chapter.replace(/\s+/g, "").startsWith("부칙") ||
    (!title && !chapter && /^부\s*칙/.test(contentText.trim()))
  );
};

export default function RuleViewer(props: RuleViewerProps) {
  return (
    <RuleViewerErrorBoundary>
      <RuleViewerInner {...props} />
    </RuleViewerErrorBoundary>
  );
}

function RuleViewerInner({ ruleId, isAdmin }: RuleViewerProps) {
  // 1. 상태 및 훅은 모두 최상단에 선언
  const [loading, setLoading] = useState(false);
  const [ruleData, setRuleData] = useState<any>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [hideHistory, setHideHistory] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [expandedAttachments, setExpandedAttachments] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const tocScrollRef = useRef<HTMLDivElement>(null);
  const [activeTocId, setActiveTocId] = useState<string>("");
  // 클릭으로 스크롤 중엔 scroll spy가 엉뚱한 항목을 활성화하지 않도록 잠금
  const scrollLockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [popupState, setPopupState] = useState<{ isOpen: boolean; title: string; isLoading?: boolean; error?: string | null; articleData?: any; url?: string }>({ isOpen: false, title: "" });
  
  const [isDownloadPopupOpen, setIsDownloadPopupOpen] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (downloadRef.current && !downloadRef.current.contains(event.target as Node)) {
        setIsDownloadPopupOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [selectedArticlesForPrint, setSelectedArticlesForPrint] = useState<Set<string>>(new Set());
  const [isPrintPopupOpen, setIsPrintPopupOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutsidePrint(event: MouseEvent) {
      if (printRef.current && !printRef.current.contains(event.target as Node)) {
        setIsPrintPopupOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutsidePrint);
    return () => document.removeEventListener("mousedown", handleClickOutsidePrint);
  }, []);

  const handlePrintMultiple = (isAll: boolean) => {
    if (!ruleData?.currentRevision || !ruleData.currentRevision.articles) {
      alert("출력할 조문 데이터가 없습니다.");
      return;
    }
    let targetArticles = ruleData.currentRevision.articles;
    if (!isAll) {
      targetArticles = targetArticles.filter((a: any) => selectedArticlesForPrint.has(a.id));
      if (targetArticles.length === 0) {
        alert("선택된 조문이 없습니다.");
        return;
      }
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("팝업 차단이 설정되어 있습니다. 팝업 차단을 해제해주세요.");
      return;
    }

    const ruleName = ruleData?.title || "규정명 미상";

    let combinedHtml = "";
    targetArticles.forEach((a: any) => {
      let rawText = "";
      if (a.contentHtml && a.contentHtml.trim().length > 0) {
        rawText = a.contentHtml;
      } else if (a.contentText) {
        rawText = a.contentText;
      } else {
        rawText = a.title || `제${a.articleNumber}조`;
      }
      
      if (/<table/i.test(rawText)) {
        rawText = rawText.replace(/<table[\s\S]*?<\/table>/gi, (tableMatch: string) => tableMatch.replace(/\n/g, ''));
      }
      
      let bodyHtml = rawText.replace(/\n/g, "<br/>");
      bodyHtml = bodyHtml.replace(/(?:<br\s*\/?>|\s|&nbsp;)+<table/gi, '<table');
      bodyHtml = bodyHtml.replace(/<\/table>(?:<br\s*\/?>|\s|&nbsp;)+/gi, '</table>');
      
      const isOrgChart = (a.title && (a.title.includes("조직도") || a.title.includes("기구표"))) || bodyHtml.includes("조직도");
      const wrapperClass = isOrgChart ? "org-chart-wrapper" : "html-table-wrapper";
      
      const chapterName = a.chapter ? `<div class="chapter-title">${a.chapter}</div>` : "";
      combinedHtml += `
        ${chapterName}
        <div class="article-content ${wrapperClass}">${bodyHtml}</div>
        <hr style="border: 0; border-bottom: 1px dashed #ccc; margin: 30px 0;" />
      `;
    });

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
            .html-table-wrapper { width: 100%; overflow-x: auto; padding: 10px 0; }
            .html-table-wrapper table { border-collapse: collapse !important; width: 100% !important; margin: 20px 0 !important; font-size: 14px !important; background-color: white !important; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .html-table-wrapper th, .html-table-wrapper td { border: 1px solid #e2e8f0 !important; padding: 12px 16px !important; color: #334155 !important; vertical-align: middle !important; word-break: break-word !important; }
            .html-table-wrapper th { background-color: #f3f4f6 !important; font-weight: 700 !important; color: #0f172a !important; text-align: center !important; }
            .html-table-wrapper tr:first-child td { background-color: #e5e7eb !important; font-weight: 700 !important; color: #0f172a !important; text-align: center !important; }
            .org-chart-wrapper { width: 100%; overflow-x: auto; padding: 20px 0; }
            .org-chart-wrapper table { width: 100% !important; max-width: 1000px; margin: 0 auto !important; border-collapse: collapse !important; table-layout: fixed !important; background-color: transparent !important; }
            .org-chart-wrapper td, .org-chart-wrapper th { padding: 0 !important; font-family: 'Malgun Gothic', sans-serif !important; vertical-align: middle !important; }
            .org-chart-wrapper td[style*="border-left: #000000 0.425250pt solid"][style*="border-right: #000000 0.425250pt solid"] { background-color: #ffffff !important; border-radius: 4px; }
          </style>
        </head>
        <body>
          <button class="btn-print" onclick="window.print()">인쇄하기</button>
          <div class="rule-title">${ruleName}</div>
          ${combinedHtml}
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setIsPrintPopupOpen(false);
  };

  const [manualCitationData, setManualCitationData] = useState<{
    selectedText: string;
    articleId: string;
    position: { top: number; left: number };
  } | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isManualModalSaving, setIsManualModalSaving] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [activeSearchKeyword, setActiveSearchKeyword] = useState("");
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);
  const [totalSearchMatches, setTotalSearchMatches] = useState(0);

  const handleExecuteSearch = (keyword?: string) => {
    const targetKeyword = keyword !== undefined ? keyword : searchKeyword;
    if (!targetKeyword.trim()) {
      setActiveSearchKeyword("");
      setSearchMatchIndex(0);
      setTotalSearchMatches(0);
      return;
    }
    setActiveSearchKeyword(targetKeyword);
    setSearchMatchIndex(0);
    // DOM 렌더링 후 하이라이트 마크 검색 및 이동
    setTimeout(() => {
      const marks = document.querySelectorAll('.highlight-mark');
      setTotalSearchMatches(marks.length);
      if (marks.length > 0) {
        marks.forEach((m) => m.classList.remove('bg-orange-400', 'text-white'));
        marks[0].classList.add('bg-orange-400', 'text-white');
        marks[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        alert("검색어와 일치하는 내용이 없습니다.");
      }
    }, 150);
  };

  const handleNavigateSearch = (direction: 'prev' | 'next') => {
    const marks = document.querySelectorAll('.highlight-mark');
    if (marks.length === 0) return;
    
    let newIndex = searchMatchIndex;
    if (direction === 'prev') {
      newIndex = (searchMatchIndex - 1 + marks.length) % marks.length;
    } else {
      newIndex = (searchMatchIndex + 1) % marks.length;
    }
    setSearchMatchIndex(newIndex);
    
    marks.forEach((m) => m.classList.remove('bg-orange-400', 'text-white'));
    marks[newIndex].classList.add('bg-orange-400', 'text-white');
    marks[newIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setIsSelectMode(params.get('selectMode') === 'true');
    }
  }, []);

  const handleScrollTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    tocScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.querySelectorAll(".overflow-y-auto").forEach(el => el.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const handleScrollBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current?.scrollHeight || 99999, behavior: "smooth" });
    tocScrollRef.current?.scrollTo({ top: tocScrollRef.current?.scrollHeight || 99999, behavior: "smooth" });
    window.scrollTo({ top: document.body.scrollHeight || 99999, behavior: "smooth" });
    document.querySelectorAll(".overflow-y-auto").forEach(el => el.scrollTo({ top: el.scrollHeight || 99999, behavior: "smooth" }));
  };

  const currentRevision = useMemo(() => {
    if (!ruleData?.currentRevision) return null;
    const rev = { ...ruleData.currentRevision };
    if (rev.articles && Array.isArray(rev.articles)) {
       const getArticlePrefix = (art: any) => {
         const regex = /(제\d+조(?:의\s*\d+)?)/;
         const m1 = (art.title || "").match(regex);
         if (m1) return m1[1].replace(/\s/g, '');
         const m2 = (art.contentText || "").match(regex);
         if (m2) return m2[1].replace(/\s/g, '');
         
         if (art.articleNumber) {
           return `제${art.articleNumber}조`;
         }
         return "";
       };

       const filtered: any[] = [];
       // [버그 수정]: DB에 같은 조항 번호를 가진 껍데기 레코드가 중복 저장되어 위아래로 반복 렌더링되는 현상 방지
       const groupMap = new Map<string, any[]>();
       const nonGrouped: any[] = [];
       
       for (const art of rev.articles) {
          // 부칙, 별지, 서식 (8000번 이상)은 중복 제거 대상에서 제외
          if (art.articleNumber && art.articleNumber >= 8000) {
             nonGrouped.push(art);
             continue;
          }
          const prefix = getArticlePrefix(art);
          if (!prefix) {
             nonGrouped.push(art);
             continue;
          }
          // articleNumber 대신 prefix(예: "제23조")를 유일키로 사용하여 완벽히 그룹화
          const key = prefix;
          if (!groupMap.has(key)) {
             groupMap.set(key, []);
          }
          groupMap.get(key)!.push(art);
       }
       
       for (const group of Array.from(groupMap.values())) {
          if (group.length === 1) {
             filtered.push(group[0]);
          } else {
             // 동일한 조항 번호/제목인데 여러 개가 있다면 내용(contentText)이 더 긴 것(연혁 등이 포함된 진짜 레코드) 하나만 남김
             const sorted = group.sort((a, b) => (b.contentText || "").length - (a.contentText || "").length);
             filtered.push(sorted[0]);
          }
       }
       
       const allArticles = [...filtered, ...nonGrouped];
       // DB의 원래 순서(sortOrder)를 유지하도록 정렬
       allArticles.sort((a, b) => a.sortOrder - b.sortOrder);
       rev.articles = allArticles;
    }
    return rev;
  }, [ruleData]);

  const addendumDates = useMemo(() => {
    if (!currentRevision || !currentRevision.articles || !Array.isArray(currentRevision.articles)) {
      return { enactmentDateStr: null, effectiveDateStr: null };
    }
    // 별표/별지 서식 조문은 제외하고 순수 부칙만 필터링
    const addenda = currentRevision.articles.filter((a: any) => 
      isAddendumArticle(a) && !a.title?.includes("별표") && !a.title?.includes("별지") && !a.contentText?.startsWith("별표")
    );

    let explicitEnactmentDateStr: string | null = null;
    let firstEffectiveDateStr: string | null = null;
    let lastEffectiveDateStr: string | null = null;

    const parseDateStr = (raw: string) => {
      const cleaned = raw.replace(/[년월일\s]/g, '.');
      const parts = cleaned.split('.').filter(p => p.length > 0).map(Number);
      if (parts.length >= 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        if (!isNaN(d.getTime())) {
          return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
        }
      }
      return null;
    };

    const dateRegex = /(?:19|20)\d{2}\s*(?:년|\.)\s*\d{1,2}\s*(?:월|\.)\s*\d{1,2}\s*(?:일|\.)?/g;
    const enactmentRegex = /제정\s*((?:19|20)\d{2}\s*(?:년|\.)\s*\d{1,2}\s*(?:월|\.)\s*\d{1,2}\s*(?:일|\.)?)/;

    addenda.forEach((a) => {
      let textToScan = a.contentText || "";
      if (!textToScan && a.contentJson) {
        try {
          const parsed = typeof a.contentJson === "string" ? JSON.parse(a.contentJson) : a.contentJson;
          if (Array.isArray(parsed)) {
            textToScan = parsed.map((i: any) => i.text || "").join(" ");
          } else if (parsed.paragraphs) {
            textToScan = parsed.paragraphs.join(" ");
          }
        } catch (e) {}
      }

      // 1. 명시적 제정일 탐지
      const enactMatch = textToScan.match(enactmentRegex);
      if (enactMatch && !explicitEnactmentDateStr) {
        const parsed = parseDateStr(enactMatch[1]);
        if (parsed) explicitEnactmentDateStr = parsed;
      }

      // 2. 해당 부칙 내 모든 날짜 탐지 (시행일 추출)
      let match;
      let lastMatchInAddendum: string | null = null;
      let firstMatchInAddendum: string | null = null;
      while ((match = dateRegex.exec(textToScan)) !== null) {
        const parsed = parseDateStr(match[0]);
        if (parsed) {
          if (!firstMatchInAddendum) firstMatchInAddendum = parsed;
          lastMatchInAddendum = parsed;
        }
      }

      if (firstMatchInAddendum && !firstEffectiveDateStr) {
        firstEffectiveDateStr = firstMatchInAddendum;
      }
      if (lastMatchInAddendum) {
        lastEffectiveDateStr = lastMatchInAddendum;
      }
    });

    // 제정일 대원칙: 부칙에 별도로 제정일이 지정안되어 있으면, 제일 처음 부칙의 시행일
    const enactmentDateStr = explicitEnactmentDateStr || firstEffectiveDateStr || null;
    // 시행일 대원칙: 부칙의 가장 맨 마지막 시행일
    const effectiveDateStr = lastEffectiveDateStr || null;

    return { enactmentDateStr, effectiveDateStr };
  }, [currentRevision]);

  const calculatedEnactmentDateStr = useMemo(() => {
    if (!ruleData) return "미정";
    if (addendumDates.enactmentDateStr) {
      return addendumDates.enactmentDateStr;
    }
    if (ruleData.revisions && Array.isArray(ruleData.revisions)) {
      const enactmentRev = ruleData.revisions.find((r: any) => r.revisionType === 'ENACTMENT');
      if (enactmentRev && enactmentRev.enactmentDate) {
        const d = new Date(enactmentRev.enactmentDate);
        if (!isNaN(d.getTime())) return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
      }
    }
    return "미정";
  }, [ruleData, addendumDates]);

  const calculatedEffectiveDateStr = useMemo(() => {
    if (!ruleData) return "미정";
    if (addendumDates.effectiveDateStr) {
      return addendumDates.effectiveDateStr;
    }
    if (currentRevision?.effectiveDate) {
      const d = new Date(currentRevision.effectiveDate);
      if (!isNaN(d.getTime())) return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
    }
    if (currentRevision?.enactmentDate) {
      const d = new Date(currentRevision.enactmentDate);
      if (!isNaN(d.getTime())) return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
    }
    return "미정";
  }, [ruleData, currentRevision, addendumDates]);

  const isDeletedOnly = useCallback((text: string | null | undefined) => {
    if (!text) return false;
    return /^제\d+조(?:의\s*\d+)?\s*(?:\([^)]*\))?\s*[<\[〔＜（]삭제[^>\]〕＞）]*[>\]〕＞）]\s*$/.test(text.trim());
  }, []);

  const tocItems = useMemo(() => {
    if (!currentRevision || !currentRevision.articles) return [];
    let toc: any[] = [];
    let lastChapter = "";
    let lastSection = "";
    
    currentRevision.articles.forEach((a: any) => {
        // [버그 수정]: "연혁 숨기기" 상태일 때 내용이 삭제 연혁뿐인 조항 껍데기를 목록과 TOC에서 완전히 제외 (반복 노출 방지)
        if (hideHistory && isDeletedOnly(a.contentText)) {
            return;
        }

        if (a.chapter && a.chapter !== lastChapter) {
            // 부칙 chapter는 가운데 장 헤더로 표시하지 않음 (ArticleRenderer에서 통합 처리)
            if (!/^부\s*칙/.test((a.chapter || '').replace(/\s+/g, ''))) {
              const historyRegexPattern = /([<(\[＜（](?:개정|제정|신설|삭제|본조신설|전문개정|전부개정|일부개정|단서신설|후단신설|단서삭제|장\s*변경|조\s*폐지|변경|폐지|표개정|조이동|조신설|항신설|호신설|목신설|표이동|본문이동|캠퍼스명칭변경|명칭변경|서식개정|서식신설|별표개정|별지개정|[가-힣\s,･]+개정|[가-힣\s,･]+신설|[가-힣\s,･]+이동|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?)(?:[^>\])＞）]*\d+[^>\])＞）]*|[\s]*)[>\])＞）])/gi;
              const cleanChapter = a.chapter.replace(/설치.{0,2}운영.{0,2}폐지/gu, '설치·운영·폐지').replace(historyRegexPattern, '').trim();
              toc.push({ type: "chapter", id: `toc-${a.articleNumber}`, text: cleanChapter });
            }
            lastChapter = a.chapter;
        }
        if (a.section && a.section !== lastSection) {
            const historyRegexPattern = /([<(\[＜（](?:개정|제정|신설|삭제|본조신설|전문개정|전부개정|일부개정|단서신설|후단신설|단서삭제|장\s*변경|조\s*폐지|변경|폐지|표개정|조이동|조신설|항신설|호신설|목신설|표이동|본문이동|캠퍼스명칭변경|명칭변경|서식개정|서식신설|별표개정|별지개정|[가-힣\s,･]+개정|[가-힣\s,･]+신설|[가-힣\s,･]+이동|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?)(?:[^>\])＞）]*\d+[^>\])＞）]*|[\s]*)[>\])＞）])/gi;
            const cleanSection = a.section.replace(historyRegexPattern, '').trim();
            toc.push({ type: "section", id: `toc-${a.articleNumber}`, text: cleanSection });
            lastSection = a.section;
        }

        // 부칙 article이면 TOC에 '부칙' 항목 추가 (articleNumber 범위 무관)
        const isAddendumToc = isAddendumArticle(a);
        if (isAddendumToc) {
          if (!toc.some(t => t.text === '부칙')) {
            toc.push({ type: 'chapter', id: `toc-${a.articleNumber}`, text: '부칙' });
          }
          return;
        }

        let items: any = [];
        try {
          if (typeof a.contentJson === "string" && a.contentJson.includes("[object Object]")) {
            throw new Error("Invalid contentJson string");
          }
          items = typeof a.contentJson === "string" ? JSON.parse(a.contentJson) : a.contentJson;
        } catch (e) {
          // Fallback parsing error
        }
        
        if (!Array.isArray(items)) {
          let textToScan = a.contentText || "";
          if (!textToScan && items && items.paragraphs && Array.isArray(items.paragraphs)) {
             textToScan = items.paragraphs.join("\n");
          }
          
          if (textToScan) {
            const regex = /(제\d+조의?\s*\d*\s*\([^)]+\))/g;
            let match;
            let foundArticle = false;

            const formatTocArticleTitle = (title: string) => {
              const match = title.match(/^(제\d+조(?:의|\s+)?\d*)(.*)/);
              if (match) {
                let numPart = match[1].replace(/\s/g, '');
                if (numPart.match(/^제\d+조\d+$/)) {
                  numPart = numPart.replace(/조(\d+)$/, '조의$1');
                }
                return numPart + match[2];
              }
              return title;
            };

            while ((match = regex.exec(textToScan)) !== null) {
              const fullTitle = formatTocArticleTitle(match[1]);
              const articleNumMatch = fullTitle.match(/^(제\d+조의?\s*\d*)/);
              const articleNum = articleNumMatch ? articleNumMatch[1].replace(/\s/g, '') : fullTitle.replace(/\s/g, '');
              if (!toc.some(t => t.id === `toc-${articleNum}`)) {
                toc.push({ type: "article", id: `toc-${articleNum}`, text: fullTitle });
                foundArticle = true;
              } else {
                const existing = toc.find(t => t.id === `toc-${articleNum}`);
                if (existing && !existing.text.includes('(') && fullTitle.includes('(')) {
                  existing.text = fullTitle;
                }
                foundArticle = true;
              }
            }
            if (!foundArticle && a.articleNumber < 8000 && a.title) {
              const expectedTitleStart = `제${a.articleNumber}조`;
              let titleStr = a.title.trim();
              if (!/^제\d+조/.test(titleStr)) {
                 if (/^의\s*\d+/.test(titleStr)) {
                    titleStr = `${expectedTitleStart}${titleStr}`;
                 } else {
                    titleStr = `${expectedTitleStart}(${titleStr})`;
                 }
              }
              const formattedTitleStr = formatTocArticleTitle(titleStr);
              const articleNumMatch = formattedTitleStr.match(/^(제\d+조의?\d*)/);
              const uniqueId = articleNumMatch ? `toc-${articleNumMatch[1]}` : `toc-${a.articleNumber}`;
              if (!toc.some(t => t.id === uniqueId)) {
                toc.push({ type: "article", id: uniqueId, text: formattedTitleStr });
              }
            }
          } else if (a.articleNumber < 8000 && a.title) {
            const expectedTitleStart = `제${a.articleNumber}조`;
            let titleStr = a.title.trim();
            if (!/^제\d+조/.test(titleStr)) {
               if (/^의\s*\d+/.test(titleStr)) {
                  titleStr = `${expectedTitleStart}${titleStr}`;
               } else {
                  titleStr = `${expectedTitleStart}(${titleStr})`;
               }
            }
            
            const formatTocArticleTitle = (title: string) => {
              const match = title.match(/^(제\d+조(?:의|\s+)?\d*)(.*)/);
              if (match) {
                let numPart = match[1].replace(/\s/g, '');
                if (numPart.match(/^제\d+조\d+$/)) {
                  numPart = numPart.replace(/조(\d+)$/, '조의$1');
                }
                return numPart + match[2];
              }
              return title;
            };
            const formattedTitleStr = formatTocArticleTitle(titleStr);
            const articleNumMatch = formattedTitleStr.match(/^(제\d+조의?\d*)/);
            const uniqueId = articleNumMatch ? `toc-${articleNumMatch[1]}` : `toc-${a.articleNumber}`;
            if (!toc.some(t => t.id === uniqueId)) {
              toc.push({ type: "article", id: uniqueId, text: formattedTitleStr });
            }
          }
          return;
        }

        if (a.articleNumber >= 8000 && a.articleNumber < 9000) {
           // 부칙(8000번대)의 별표/별지 텍스트 기반 TOC 스캔 유지
           const hasHtmlAttachments = currentRevision.articles.some((art: any) => art.articleNumber >= 9000);
           const uploadedAttachments = ruleData?.attachments?.filter((f: any) => f.title.startsWith("[별표]") || f.title.startsWith("[별지]") || f.title.startsWith("[별첨]")) || [];
           if (!hasHtmlAttachments && uploadedAttachments.length === 0) {
              const textAttachments = items.filter((item: any) => {
                 if (!item || !item.text) return false;
                 return /^(?:\[|〔)(별지|별표|서식|별첨)/.test(String(item.text).trim());
              });
              if (textAttachments.length > 0) {
                 if (!toc.some(t => t.id === "toc-attachments")) {
                    toc.push({ type: "chapter", id: "toc-attachments", text: "별표/별지/별첨 목록" });
                 }
                 textAttachments.forEach((item: any, i: number) => {
                    let safeText = String(item.text).trim();
                    safeText = safeText.replace(/^〔/, '[').replace(/〕$/, ']');
                    const displayText = safeText.replace(/^\[(?:별표|별지|전문|서식|별첨)\]\s*([\d-]+\s*)?/, "");
                    toc.push({ type: "attachment", id: `toc-text-attach-${a.articleNumber}-${i}`, text: displayText });
                 });
              }
           }
           return;
        }
        
        // 별지, 서식, 별표 (9000번대)인 경우 여기서 처리하지 않고 하단에서 일괄 처리
        if (a.articleNumber >= 9000) {
           return;
        }

        // DB Migration 중 본문에서 유실된 제1조 제목 강제 복구 및 생명윤리위 조문이름 복구 (TOC용)
        if (a.articleNumber < 8000) {
           let bestTitle = "";
           const fullRegex = /(제\d+조의?\s*\d*\s*\([^)]+\))/;
           
           let fullText = a.contentText || "";
           if (!fullText && Array.isArray(items)) {
              fullText = items.map((itm: any) => typeof itm === 'string' ? itm : String(itm?.text || "")).join(" ");
           }
           
           const textMatch = fullText.match(fullRegex);
           if (textMatch) {
              bestTitle = textMatch[1];
           } else if (a.title) {
              const expectedTitleStart = `제${a.articleNumber}조`;
              let titleStr = a.title.trim();
              if (!/^제\d+조/.test(titleStr)) {
                 if (/^의\s*\d+/.test(titleStr)) {
                    titleStr = `${expectedTitleStart}${titleStr}`;
                 } else {
                    titleStr = `${expectedTitleStart}(${titleStr})`;
                 }
              }
              bestTitle = titleStr;
           }

           if (bestTitle) {
              const formatTocArticleTitle = (title: string) => {
                const match = title.match(/^(제\d+조(?:의|\s+)?\d*)(.*)/);
                if (match) {
                  let numPart = match[1].replace(/\s/g, '');
                  if (numPart.match(/^제\d+조\d+$/)) {
                    numPart = numPart.replace(/조(\d+)$/, '조의$1');
                  }
                  return numPart + match[2];
                }
                return title;
              };
              const formattedTitleStr = formatTocArticleTitle(bestTitle);
              const titleMatch = formattedTitleStr.match(/^(제\d+조의?\s*\d*)/);
              const titleNum = titleMatch ? titleMatch[1].replace(/\s/g, '') : `${a.articleNumber}`;
              
              if (!toc.some(t => t.id === `toc-${titleNum}`)) {
                 toc.push({ type: "article", id: `toc-${titleNum}`, text: formattedTitleStr });
              } else {
                 const existing = toc.find(t => t.id === `toc-${titleNum}`);
                 if (existing && existing.text && !existing.text.includes('(') && formattedTitleStr.includes('(')) {
                    existing.text = formattedTitleStr;
                 }
              }
           }
        }

        items.forEach((item: any) => {
          if (!item) return;
          
          if (typeof item === 'string') {
            const regex = /(제\d+조의?\s*\d*\s*\([^)]+\))/g;
            let match;
            
            const formatTocArticleTitle = (title: string) => {
              const match = title.match(/^(제\d+조(?:의|\s+)?\d*)(.*)/);
              if (match) {
                let numPart = match[1].replace(/\s/g, '');
                if (numPart.match(/^제\d+조\d+$/)) {
                  numPart = numPart.replace(/조(\d+)$/, '조의$1');
                }
                return numPart + match[2];
              }
              return title;
            };

            while ((match = regex.exec(item)) !== null) {
              const fullTitle = formatTocArticleTitle(match[1]);
              const articleNumMatch = fullTitle.match(/^(제\d+조의?\s*\d*)/);
              const articleNum = articleNumMatch ? articleNumMatch[1].replace(/\s/g, '') : fullTitle.replace(/\s/g, '');
              if (!toc.some(t => t.id === `toc-${articleNum}`)) {
                toc.push({ type: "article", id: `toc-${articleNum}`, text: fullTitle });
              } else {
                const existing = toc.find(t => t.id === `toc-${articleNum}`);
                if (existing && !existing.text.includes('(') && fullTitle.includes('(')) {
                  existing.text = fullTitle;
                }
              }
            }
            return;
          }
          
          if (typeof item !== 'object') return;
          
          const historyRegexPattern = /([<(\[＜（](?:개정|제정|신설|삭제|본조신설|전문개정|전부개정|일부개정|단서신설|후단신설|단서삭제|장\s*변경|조\s*폐지|변경|폐지|표개정|조이동|조신설|항신설|호신설|목신설|표이동|본문이동|캠퍼스명칭변경|명칭변경|서식개정|서식신설|별표개정|별지개정|[가-힣\s,･]+개정|[가-힣\s,･]+신설|[가-힣\s,･]+이동|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?)(?:[^>\])＞）]*\d+[^>\])＞）]*|[\s]*)[>\])＞）])/gi;
          if (item.type === "chapter") {
            const rawText = typeof item.text === 'string' ? item.text.replace(/설치.{0,2}운영.{0,2}폐지/gu, '설치·운영·폐지') : String(item.text || "");
            const chapterText = rawText.split('\n')[0].replace(historyRegexPattern, '').trim();
            if (toc.length > 0 && toc[toc.length - 1].type === "chapter" && toc[toc.length - 1].text === chapterText) return;
            toc.push({ type: "chapter", id: `toc-${rawText.split('\n')[0].trim().replace(new RegExp("\\s", "g"), '-')}`, text: chapterText });
          } else if (item.type === "section") {
            const rawText = typeof item.text === 'string' ? item.text : String(item.text || "");
            const sectionText = rawText.split('\n')[0].replace(historyRegexPattern, '').trim();
            if (toc.length > 0 && toc[toc.length - 1].type === "section" && toc[toc.length - 1].text === sectionText) return;
            toc.push({ type: "section", id: `toc-${rawText.split('\n')[0].trim().replace(new RegExp("\\s", "g"), '-')}`, text: sectionText });
          } else if (item.type === "article") {
            const articleNum = typeof item.num === 'string' ? item.num : String(item.num || "");
            let displayTitle = articleNum;
            const fullRegex = /(제\d+조의?\s*\d*\s*\([^)]+\))/;
            const m = String(item.text || "").match(fullRegex);
            if (m) {
              displayTitle = m[1];
            }
            if (!toc.some(t => t.id === `toc-${articleNum}`)) {
              toc.push({ type: "article", id: `toc-${articleNum}`, text: displayTitle });
            } else {
              const existing = toc.find(t => t.id === `toc-${articleNum}`);
              if (existing && !existing.text.includes('(') && displayTitle.includes('(')) {
                existing.text = displayTitle;
              }
            }
          } else if (item.type === "text" || item.type === "paragraph" || item.type === "item" || item.type === "subitem") {
            const safeText = String(item.text || "");
            if (/^제\d+관/.test(safeText.trim())) {
              const subsectionText = safeText.trim();
              if (toc.length > 0 && toc[toc.length - 1].type === "subsection" && toc[toc.length - 1].text === subsectionText) return;
              toc.push({ type: "subsection", id: `toc-${subsectionText.replace(new RegExp("\\s", "g"), '-')}`, text: subsectionText });
            }
            // Extract glued articles: "제N조(제목)"
            const regex = /(제\d+조의?\s*\d*\s*\([^)]+\))/g;
            let match;
            
            const formatTocArticleTitle = (title: string) => {
              const match = title.match(/^(제\d+조(?:의|\s+)?\d*)(.*)/);
              if (match) {
                let numPart = match[1].replace(/\s/g, '');
                if (numPart.match(/^제\d+조\d+$/)) {
                  numPart = numPart.replace(/조(\d+)$/, '조의$1');
                }
                return numPart + match[2];
              }
              return title;
            };

            while ((match = regex.exec(safeText)) !== null) {
              const fullTitle = formatTocArticleTitle(match[1]);
              const articleNumMatch = fullTitle.match(/^(제\d+조의?\s*\d*)/);
              const articleNum = articleNumMatch ? articleNumMatch[1].replace(/\s/g, '') : fullTitle.replace(/\s/g, '');
              
              if (!toc.some(t => t.id === `toc-${articleNum}`)) {
                toc.push({ type: "article", id: `toc-${articleNum}`, text: fullTitle });
              } else {
                const existing = toc.find(t => t.id === `toc-${articleNum}`);
                if (existing && !existing.text.includes('(') && fullTitle.includes('(')) {
                  existing.text = fullTitle;
                }
              }
            }
            
            if (/(?:^|\n)\s*\d+\.\s*(?:\(시행일\))?\s*이\s*규정은.*시행한다/i.test(safeText) || /(?:^|\n)\s*\d+\.\s*\((?:시행일|경과조치|적용례|준용|폐지)\)/i.test(safeText)) {
              if (!toc.some(t => t.text === '부칙')) {
                toc.push({ type: 'chapter', id: 'toc-addendum-glued', text: '부칙' });
              }
            }
          }
        });
    });
    
    // Add attachments from uploaded files to TOC
    const uploadedAttachments = ruleData?.attachments || [];
    
    if (uploadedAttachments.length > 0) {
      const uniqueBaseNames = new Set<string>();
      uploadedAttachments.forEach((a: any) => {
        const baseName = a.title
          .replace(/\.[^/.]+$/, "")
          .replace(/\(최종\)$/i, "")
          .replace(/[\u200B-\u200D\uFEFF]/g, "")
          .trim()
          .replace(/\s+/g, " ");
        if (!uniqueBaseNames.has(baseName)) {
           uniqueBaseNames.add(baseName);
        }
      });

      const mainFiles = Array.from(uniqueBaseNames).filter((name: any) => name.includes("[전문]"));
      const subFiles = Array.from(uniqueBaseNames).filter((name: any) => !name.includes("[전문]")).sort(compareAttachmentNames);

      if (mainFiles.length > 0) {
         if (!toc.some((t: any) => t.id === "toc-main-files")) {
            toc.push({ type: "chapter", id: "toc-main-files", text: "현 규정 다운로드" });
         }
         mainFiles.forEach((baseName: string) => {
            // [전문] 1-0-4 교원 징계규정 → "전문 | 1-0-4 교원 징계규정"
            const basicMatch = baseName.match(/^\[([^\]]+)\]\s*(.*)$/);
            const displayText = basicMatch ? `[${basicMatch[1]}] ${basicMatch[2]}` : baseName;
            toc.push({ type: "attachment", id: `toc-attach-${baseName}`, text: displayText });
         });
      }

      if (subFiles.length > 0) {
         if (!toc.some((t: any) => t.id === "toc-attachments")) {
            toc.push({ type: "chapter", id: "toc-attachments", text: "별표/별지/별첨 목록" });
         }
         subFiles.forEach((baseName: string) => {
            // [별지] 1-0-4 [별지 제1-1호 서식] 확인서 → "[별지 제1-1호 서식] 1-0-4 확인서"
            const detailedMatch = baseName.match(/^\[(?:별지|별표|별첨|서식)\]\s*([\d\-]+\s+)\[([^\]]+)\]\s*(.*)$/);
            if (detailedMatch) {
              const ruleNum = detailedMatch[1].trim();
              const badgeText = detailedMatch[2];
              const fileName = detailedMatch[3];
              toc.push({ type: "attachment", id: `toc-attach-${baseName}`, text: `[${badgeText}] ${ruleNum} ${fileName}` });
            } else {
              const basicMatch2 = baseName.match(/^\[([^\]]+)\]\s*(.*)$/);
              const displayText = basicMatch2 ? `[${basicMatch2[1]}] ${basicMatch2[2]}` : baseName;
              toc.push({ type: "attachment", id: `toc-attach-${baseName}`, text: displayText });
            }
         });
      }
    }
    
    return toc;
  }, [currentRevision, ruleData?.attachments, hideHistory, isDeletedOnly]);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      // 클릭으로 인한 smooth scroll 중엔 scroll spy 비활성화
      if (scrollLockTimer.current !== null) return;

      const scrollContainer = scrollRef.current;
      const scrollY = scrollContainer.scrollTop;
      const containerRect = scrollContainer.getBoundingClientRect();
      
      let currentActiveId = "";
      for (let i = 0; i < tocItems.length; i++) {
        const item = tocItems[i];
        const el = document.getElementById(item.id);
        if (el) {
          // el의 scrollContainer 내부 상대 위치 계산
          const elRect = el.getBoundingClientRect();
          const elRelTop = elRect.top - containerRect.top + scrollY;
          const offsetTop = elRelTop - 15;
          if (scrollY >= offsetTop) {
            currentActiveId = item.id;
          } else {
            // tocItems는 순서대로 정렬돼 있으므로 이후는 건너뜀
            break;
          }
        }
      }

      if (currentActiveId && currentActiveId !== activeTocId) {
        setActiveTocId(currentActiveId);
        
        // Auto scroll TOC
        const tocEl = document.getElementById(`li-${currentActiveId}`);
        if (tocEl && tocScrollRef.current) {
          const tocContainer = tocScrollRef.current;
          const tocElTop = tocEl.offsetTop;
          const containerHeight = tocContainer.clientHeight;
          const currentScroll = tocContainer.scrollTop;
          
          if (tocElTop < currentScroll + 50 || tocElTop > currentScroll + containerHeight - 50) {
            tocContainer.scrollTo({ top: tocElTop - containerHeight / 3, behavior: 'smooth' });
          }
        }
      }
    };

    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Trigger once on mount
      handleScroll();
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [tocItems, activeTocId]);

  // 규정 데이터 패치 (선택한 버전 포함)
  useEffect(() => {
    async function loadRule() {
      if (!ruleId) return;
      setLoading(true);
      try {
        const url = selectedVersion !== null ? `/api/rules/${ruleId}?version=${encodeURIComponent(selectedVersion)}&t=${Date.now()}` : `/api/rules/${ruleId}?t=${Date.now()}`;
        const res = await fetch(url);
        const data = (await res.json()) as any;
        setRuleData(data);
        
        // 처음 로드 시에는 현재 로드된 버전의 숫자를 selectedVersion에 동기화
        if (selectedVersion === null && data.currentRevision) {
          setSelectedVersion(data.currentRevision.version);
        }
      } catch (error) {
        console.error("Failed to load rule detail:", error);
      } finally {
        setLoading(false);
      }
    }
    loadRule();
    
    const handleUpdate = () => { loadRule(); };
    window.addEventListener('rule-updated', handleUpdate);
    return () => window.removeEventListener('rule-updated', handleUpdate);
  }, [ruleId, selectedVersion]);

  useEffect(() => {
    const handleGlobalClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest('.cited-article-link')) {
        e.preventDefault();
        const link = target.closest('.cited-article-link') as HTMLElement;
        const ruleName = link.getAttribute('data-rule-name') || "";
        const articleNum = link.getAttribute('data-article') || "";
        const urlAttr = link.getAttribute('data-url');
        
        const popupTitle = ruleName ? `${ruleName} ${articleNum}` : articleNum;
        setPopupState({ isOpen: true, title: popupTitle, isLoading: true, error: null, articleData: null, url: urlAttr || undefined });
        
        if (urlAttr) {
          // URL이 있으면 데이터 로드할 필요 없이 바로 보여줌
          setPopupState({ isOpen: true, title: popupTitle, isLoading: false, articleData: null, url: urlAttr });
          return;
        }

        try {
          const cleanRuleName = ruleName.replace(/\s/g, '');
          const isCurrentRule = !ruleName || cleanRuleName.includes("이규정") || cleanRuleName.includes("본규정") || cleanRuleName.includes("동규정") || (ruleData?.title && ruleData.title.replace(/\s/g, '').includes(cleanRuleName));
          
          if (isCurrentRule) {
             const articleMatch = ruleData?.currentRevision?.articles?.find((a: any) => {
                const articleStr = String(a.articleNumber);
                const titleStr = a.title || "";
                return articleStr === articleNum.replace(/[^0-9]/g, '') || titleStr.includes(articleNum);
             });
             if (articleMatch) {
               setPopupState({ isOpen: true, title: popupTitle, isLoading: false, articleData: articleMatch });
             } else {
               setPopupState({ isOpen: true, title: popupTitle, isLoading: false, error: "해당 조문을 현재 규정에서 찾을 수 없습니다." });
             }
          } else {
             // Search for the other rule
             const searchRes = await fetch(`/api/rules/search?query=${encodeURIComponent(ruleName)}`);
             const searchData = (await searchRes.json()) as any;
             if (searchData && searchData.rules && searchData.rules.length > 0) {
                const foundRuleId = searchData.rules[0].id;
                const ruleRes = await fetch(`/api/rules/${foundRuleId}`);
                const foundRuleData = (await ruleRes.json()) as any;
                
                const articleMatch = foundRuleData?.currentRevision?.articles?.find((a: any) => {
                   const articleStr = String(a.articleNumber);
                   const titleStr = a.title || "";
                   return articleStr === articleNum.replace(/[^0-9]/g, '') || titleStr.includes(articleNum);
                });
                if (articleMatch) {
                   setPopupState({ isOpen: true, title: popupTitle, isLoading: false, articleData: articleMatch });
                } else {
                   setPopupState({ isOpen: true, title: popupTitle, isLoading: false, error: "해당 조문을 인용된 규정에서 찾을 수 없습니다." });
                }
             } else {
                setPopupState({ isOpen: true, title: popupTitle, isLoading: false, error: "인용된 규정을 시스템에서 찾을 수 없습니다." });
             }
          }
        } catch (err) {
          console.error("Failed to load cited article:", err);
          setPopupState({ isOpen: true, title: popupTitle, isLoading: false, error: "조문을 불러오는 중 오류가 발생했습니다." });
        }
      }
    };
    
    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, [ruleData]);

  // ruleId가 바뀔 때마다 버전 초기화 및 스크롤 맨 위로 이동
  useEffect(() => {
    setSelectedVersion(null);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [ruleId]);

  if (loading && !ruleData) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 bg-white">
        <CircularProgress size={45} />
        <Typography variant="body1" color="textSecondary" className="font-semibold">
          규정 데이터를 분석하여 렌더링을 구성하는 중입니다...
        </Typography>
      </div>
    );
  }

  if (!ruleData) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white text-slate-400">
        <ArticleIcon sx={{ fontSize: 60 }} className="mb-4 text-slate-300" />
        <p className="text-lg font-medium">규정을 불러올 수 없거나 존재하지 않는 규정입니다.</p>
        <p className="text-sm mt-1">좌측 트리 메뉴에서 보고자 하는 규정을 다시 선택해 주십시오.</p>
      </div>
    );
  }

  const { title, ruleNumber, category, department, attachments, revisions } = ruleData;
  const cleanTitle = title?.replace(/-\s*\d{4}\.?\s*\d{1,2}\.?\s*\d{1,2}\.?\s*$/, '').trim() || title;

  const handleVersionSelect = (verNum: number) => {
    setSelectedVersion(verNum);
  };

  

  

  const handleManualCitationSave = async (ruleName: string, articleNum: string, url: string = "") => {
    if (!manualCitationData) return;
    setIsManualModalSaving(true);
    try {
      const targetArticle = currentRevision?.articles?.find((a: any) => a.id === manualCitationData.articleId);
      if (!targetArticle) throw new Error("조문을 찾을 수 없습니다.");
      
      const selectedText = manualCitationData.selectedText;
      const urlPart = url ? ` url="${url}"` : "";
      const replacement = `[cite rule="${ruleName}" article="${articleNum}"${urlPart}]${selectedText}[/cite]`;
      
      let newContentText = targetArticle.contentText;
      if (newContentText) {
        newContentText = newContentText.replace(selectedText, replacement);
      }
      
      let newContentJson = typeof targetArticle.contentJson === 'string' 
        ? JSON.parse(targetArticle.contentJson) 
        : JSON.parse(JSON.stringify(targetArticle.contentJson));

      const replaceInJson = (items: any[]) => {
         if (!Array.isArray(items)) return;
         items.forEach(item => {
            if (item && typeof item.text === 'string') {
               item.text = item.text.replace(selectedText, replacement);
            }
            if (item && Array.isArray(item.children)) {
               replaceInJson(item.children);
            }
         });
      };
      
      if (newContentJson) {
         if (Array.isArray(newContentJson)) {
            replaceInJson(newContentJson);
         } else if (newContentJson.paragraphs) {
            newContentJson.paragraphs = newContentJson.paragraphs.map((p: any) => 
               typeof p === 'string' ? p.replace(selectedText, replacement) : p
            );
         }
      }
      
      let newContentHtml = targetArticle.contentHtml;
      if (newContentHtml) {
        newContentHtml = newContentHtml.replace(selectedText, replacement);
      }
      
      const res = await fetch(`/api/admin/articles/${manualCitationData.articleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentText: newContentText,
          contentJson: newContentJson,
          contentHtml: newContentHtml
        })
      });
      
      if (!res.ok) throw new Error("업데이트 실패");
      
      alert("인용이 성공적으로 연결되었습니다.");
      setIsManualModalOpen(false);
      setManualCitationData(null);
      window.getSelection()?.removeAllRanges();
      window.dispatchEvent(new CustomEvent('rule-updated'));
    } catch (e: any) {
      alert("오류: " + e.message);
    } finally {
      setIsManualModalSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden relative border border-slate-200">
      {/* 1. 상단 타이틀 및 브레드크럼 */}
      <div className="bg-[#009b9e]/[0.12] border-b border-slate-200 px-4 md:px-6 py-3.5 md:py-4 shrink-0 flex flex-col md:flex-row md:items-center md:justify-between gap-1.5 md:gap-4 z-10 shadow-sm relative overflow-hidden">
        <h1 className="text-lg md:text-2xl font-black text-[#007073] tracking-tight ml-1 md:ml-2 line-clamp-2 md:line-clamp-none">
          {ruleNumber ? `${ruleNumber} ` : ""}{cleanTitle}
        </h1>
        <div className="text-[13px] md:text-[14px] text-slate-500 font-medium tracking-wider w-full md:w-auto whitespace-normal break-keep leading-snug ml-1 md:ml-0 flex flex-wrap items-center gap-1.5">
          <button 
            onClick={() => { sessionStorage.removeItem("activeRuleId"); sessionStorage.removeItem("activeCategoryId"); window.location.href = "/"; }}
            className="hover:text-blue-600 hover:underline cursor-pointer font-semibold transition-colors"
          >
            HOME
          </button>
          <span>&gt;</span>
          <button 
            onClick={() => { if (category?.id) { sessionStorage.setItem("activeCategoryId", category.id); sessionStorage.setItem("activeCategoryName", category.name || "분류"); sessionStorage.removeItem("activeRuleId"); window.location.href = "/"; } }}
            className="hover:text-blue-600 hover:underline cursor-pointer font-semibold transition-colors"
          >
            {category?.name || "분류"}
          </button>
          <span>&gt;</span>
          <button 
            onClick={handleScrollTop}
            className="font-bold text-slate-700 hover:text-blue-600 hover:underline cursor-pointer transition-colors text-left"
          >
            {cleanTitle}
          </button>
        </div>
      </div>

      {/* 2. 툴바 (버전 변경, 검색, 버튼들) */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 shrink-0 flex flex-wrap items-center justify-between gap-4 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          {/* 버전 셀렉트 */}
          <select 
            className="border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-700 bg-white min-w-[140px] focus:outline-none focus:border-blue-500 cursor-pointer"
            value={selectedVersion || (currentRevision?.version ?? "")}
            onChange={(e) => handleVersionSelect(Number(e.target.value))}
          >
            {revisions?.map((rev: any) => (
              <option key={rev.version} value={rev.version}>
                {rev.enactmentDate && !isNaN(new Date(rev.enactmentDate).getTime()) 
                  ? new Date(rev.enactmentDate).toLocaleDateString() 
                  : "날짜없음"} {getRevisionTypeName(rev.revisionType)}
              </option>
            ))}
          </select>

          {/* 본문 검색 */}
          <div className="flex items-center bg-white border border-slate-300 rounded overflow-hidden">
            <input 
              type="text" 
              placeholder="전자규정집 내용 검색" 
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleExecuteSearch(); }}
              className="px-2 py-1 text-xs outline-none w-[160px]"
            />
            <button onClick={() => handleExecuteSearch()} className="px-2 py-1 text-blue-700 bg-slate-50 border-l border-slate-300 hover:bg-slate-100 font-black cursor-pointer text-xs">Q</button>
            <button onClick={() => handleNavigateSearch('prev')} className="px-1.5 py-1 text-slate-500 bg-slate-50 border-l border-slate-300 hover:bg-slate-100 text-xs font-black cursor-pointer">&lt;</button>
            <button onClick={() => handleNavigateSearch('next')} className="px-1.5 py-1 text-slate-500 bg-slate-50 border-l border-slate-300 hover:bg-slate-100 text-xs font-black cursor-pointer">&gt;</button>
          </div>
        </div>

        {/* 액션 버튼 그룹 */}
        <div className="flex items-center gap-1.5 flex-wrap relative">
          <div className="relative" ref={downloadRef}>
            <button 
              onClick={() => setIsDownloadPopupOpen(!isDownloadPopupOpen)}
              className="flex items-center gap-1 px-2.5 py-1 border border-blue-200 bg-white text-blue-700 text-[11px] font-bold rounded hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <FileDownloadIcon sx={{ fontSize: 14 }} /> 다운로드
            </button>
            {isDownloadPopupOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded shadow-lg py-1 z-50 flex flex-col w-[120px]">
                {(() => {
                  const getDownloadUrl = (file: any) => {
                    let fullTitle = file.title || "download";
                    if (file.fileType && !fullTitle.toLowerCase().endsWith(`.${file.fileType.toLowerCase()}`)) {
                      fullTitle += `.${file.fileType}`;
                    }
                    const encodedTitle = encodeURIComponent(fullTitle);
                    if (file.fileUrl?.startsWith('/api/files/')) {
                      return `${file.fileUrl}?download=true&filename=${encodedTitle}`;
                    }
                    return `/api/download?fileUrl=${encodeURIComponent(file.fileUrl || "")}&filename=${encodedTitle}`;
                  };
                  
                  // 최신 연혁(현행 규정) 추출
                  const sortedRevisions = [...(ruleData?.revisions || [])].sort((a: any, b: any) => {
                    const dateA = new Date(a.enactmentDate || 0).getTime();
                    const dateB = new Date(b.enactmentDate || 0).getTime();
                    if (dateB !== dateA) return dateB - dateA;
                    return (b.version || 0) - (a.version || 0);
                  });
                  const latestRevId = sortedRevisions[0]?.id;
                  
                  // 메인 화면 다운로드 파일은 가장 최근에 업로드된(제개정된) 원문 파일로 지정
                  const sortedAttachments = [...(ruleData?.attachments || [])].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                  const isMainFile = (title: string) => title.includes("[전문]") || (!title.includes("[별표") && !title.includes("[별지") && !title.includes("[서식") && !title.includes("[별첨"));
                  const mainRuleHwp = sortedAttachments.find((f: any) => isMainFile(f.title) && (f.fileType?.toLowerCase() === "hwp" || f.title.toLowerCase().endsWith(".hwp")));
                  const mainRulePdf = sortedAttachments.find((f: any) => isMainFile(f.title) && (f.fileType?.toLowerCase() === "pdf" || f.title.toLowerCase().endsWith(".pdf")));
                  return (
                    <>
                      <a
                        href={mainRuleHwp ? getDownloadUrl(mainRuleHwp) : "#"}
                        download={!!mainRuleHwp}
                        target={mainRuleHwp ? "_blank" : undefined}
                        onClick={(e) => !mainRuleHwp && e.preventDefault()}
                        className={`px-3 py-1.5 text-[11px] font-bold flex items-center gap-1.5 ${mainRuleHwp ? "text-slate-700 hover:bg-blue-50 cursor-pointer" : "text-slate-300 cursor-not-allowed"}`}
                      >
                        <span className="bg-blue-100 text-blue-700 px-1 rounded text-[9px]">HWP</span> 다운로드
                      </a>
                      <a
                        href={mainRulePdf ? getDownloadUrl(mainRulePdf) : "#"}
                        download={!!mainRulePdf}
                        target={mainRulePdf ? "_blank" : undefined}
                        onClick={(e) => !mainRulePdf && e.preventDefault()}
                        className={`px-3 py-1.5 text-[11px] font-bold flex items-center gap-1.5 ${mainRulePdf ? "text-slate-700 hover:bg-red-50 cursor-pointer" : "text-slate-300 cursor-not-allowed"}`}
                      >
                        <span className="bg-red-100 text-red-700 px-1 rounded text-[9px]">PDF</span> 다운로드
                      </a>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
          
          <div className="relative" ref={printRef}>
            <button 
              onClick={() => setIsPrintPopupOpen(!isPrintPopupOpen)}
              className="flex items-center gap-1 px-2.5 py-1 border border-slate-300 bg-white text-slate-700 text-[11px] font-bold rounded hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <PrintIcon sx={{ fontSize: 14 }} className="text-slate-600" /> 인쇄
            </button>
            {isPrintPopupOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded shadow-lg py-1 z-50 flex flex-col w-[120px]">
                <button
                  onClick={() => handlePrintMultiple(false)}
                  disabled={selectedArticlesForPrint.size === 0}
                  className={`px-3 py-2 text-[11px] font-bold text-left flex items-center gap-1.5 ${selectedArticlesForPrint.size > 0 ? "text-slate-700 hover:bg-slate-50 cursor-pointer" : "text-slate-300 cursor-not-allowed"}`}
                >
                  <FactCheckIcon sx={{ fontSize: 14 }} className={selectedArticlesForPrint.size > 0 ? "text-blue-500" : "text-slate-300"} />
                  선택조문 인쇄
                </button>
                <button
                  onClick={() => handlePrintMultiple(true)}
                  className="px-3 py-2 text-[11px] font-bold text-left text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"
                >
                  <LibraryBooksIcon sx={{ fontSize: 14 }} className="text-orange-500" />
                  전체인쇄
                </button>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => window.open(`/revision/${ruleId}${isAdmin ? "?admin=true" : ""}`, "_blank", "width=720,height=780,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes")}
            className="flex items-center gap-1 px-2.5 py-1 border border-slate-300 bg-white text-slate-700 text-[11px] font-bold rounded hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <InfoIcon sx={{ fontSize: 14 }} className="text-blue-500" /> 개정정보
          </button>
          
          <button 
            onClick={() => window.open(`/compare?ruleId=${ruleId}`, "_blank", "width=1600,height=900,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes")}
            className="flex items-center gap-1 px-2.5 py-1 border border-slate-300 bg-white text-slate-700 text-[11px] font-bold rounded hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <CompareArrowsIcon sx={{ fontSize: 14 }} className="text-purple-500" /> 신구대비표
          </button>
          <button 
            onClick={() => window.open(`/twocolumn?ruleId=${ruleId}`, "_blank", "width=1400,height=800,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes")}
            className="flex items-center gap-1 px-2.5 py-1 border border-slate-300 bg-white text-slate-700 text-[11px] font-bold rounded hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArticleIcon sx={{ fontSize: 14 }} className="text-slate-600" /> 2단보기
          </button>
        </div>
      </div>

      {/* 3. 2단 분할 본문 영역 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 좌측 목차 (TOC) */}
        <div ref={tocScrollRef} className={`bg-white border-r border-slate-200 overflow-y-auto scrollbar shrink-0 flex flex-col relative scroll-smooth transition-[width,margin] duration-300 ${isTocOpen ? "w-[320px] ml-0" : "w-0 overflow-hidden border-r-0"}`}>
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <HistoryIcon className="text-blue-700" sx={{ fontSize: 16 }} />
              <span className="font-bold text-sm text-slate-800 break-keep">목차 ({tocItems.filter(i => i.type === 'article').length})</span>
            </div>
          </div>
          <ul className="p-3 space-y-1.5">
            {tocItems.map((item, idx) => {
              let itemClass = "px-3 py-1 text-slate-600 hover:text-blue-700 hover:font-bold hover:bg-slate-50 cursor-pointer text-[13px] flex gap-1 transition-all";
              if (item.type === "chapter") {
                if (item.id === "toc-main-files" || item.id === "toc-attachments") {
                  itemClass = "mt-4 mb-2 px-2 py-1.5 bg-red-50 border-y border-red-100 font-bold text-slate-800 text-[13px] tracking-tight";
                } else {
                  itemClass = "mt-4 mb-2 px-2 py-1.5 bg-slate-50 border-y border-slate-200 font-bold text-slate-700 text-[13px] tracking-tight";
                }
              } else if (item.type === "section") {
                itemClass = "mt-3 mb-1 px-3 py-1 bg-blue-50/30 text-blue-800 font-bold text-[13px] border-l-2 border-blue-500 tracking-tight";
              } else if (item.type === "subsection") {
                itemClass = "mt-2 mb-1 pl-6 pr-3 py-1 text-[#000080] font-bold text-[12.5px] tracking-tight before:content-['└'] before:mr-1.5 before:text-blue-400";
              } else if (item.type === "attachment") {
                itemClass = "px-4 py-1 text-slate-600 hover:text-blue-700 hover:font-bold hover:bg-slate-50 cursor-pointer text-[13px] flex gap-1 transition-all flex items-center before:content-['•'] before:mr-1.5 before:text-slate-400";
              } else {
                // Article items can have slight indent
                itemClass = "px-5 py-1 text-slate-600 hover:text-blue-700 hover:font-bold hover:bg-slate-50 cursor-pointer text-[13px] flex gap-1 transition-all";
              }
              
              if (item.id === activeTocId) {
                // 추가적인 active 스타일 (예: 배경색이나 글씨색)
                itemClass += " bg-blue-50 !text-blue-700 !font-bold rounded border border-blue-200";
              }

              return (
              <li key={idx} id={`li-${item.id}`} className={itemClass}>
                <a href={`#${item.id}`} className="block w-full truncate" title={item.text} onClick={(e) => {
                  e.preventDefault();
                  // 클릭 즉시 해당 항목을 활성화
                  setActiveTocId(item.id);
                  // smooth scroll 중 scroll spy가 다른 항목을 활성화하지 않도록 잠금
                  if (scrollLockTimer.current !== null) clearTimeout(scrollLockTimer.current);
                  scrollLockTimer.current = setTimeout(() => {
                    scrollLockTimer.current = null;
                  }, 900);
                  document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}>
                  {item.text}
                </a>
              </li>
              );
            })}
          </ul>
        </div>

        {/* TOC Toggle Tab - Attached to the right edge of TOC */}
        <div className="relative z-30 w-0 h-full">
          <button
            onClick={() => setIsTocOpen(!isTocOpen)}
            className={`fixed top-[45vh] -translate-y-1/2 w-6 h-16 bg-[#007073] hover:bg-[#005a5c] text-white flex items-center justify-center rounded-r-lg shadow-lg cursor-pointer transition-all duration-300 border border-l-0 border-[#005a5c] active:scale-95 z-[60] ${isTocOpen ? 'left-[320px]' : 'left-0'} lg:absolute lg:top-[45vh] lg:-left-px`}
            title={isTocOpen ? "목차 닫기" : "목차 열기"}
          >
            {isTocOpen ? <KeyboardArrowLeftIcon sx={{ fontSize: 18 }} /> : <KeyboardArrowRightIcon sx={{ fontSize: 18 }} />}
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar bg-white p-10 relative scroll-smooth">
          <div className="max-w-4xl mx-auto mt-4 relative">
            {/* 규정 제목 */}
            <h2 className="text-[26px] font-black text-center text-[#007073] mb-8 tracking-tight break-keep">{cleanTitle}</h2>
            
            {/* 법령 정보 (시행일, 담당부서) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 border-b-2 border-slate-700 pb-3 gap-3">
              <div className="text-[14px] font-medium text-[#1E5D9B]">
                [시행 {calculatedEffectiveDateStr}] [제정 {calculatedEnactmentDateStr}]
                {currentRevision?.revisionType && currentRevision.revisionType !== 'ENACTMENT' ? ` [${getRevisionTypeName(currentRevision.revisionType)} ${currentRevision.enactmentDate ? new Date(currentRevision.enactmentDate).toLocaleDateString('ko-KR') : "미정"}]` : ""}
              </div>
              <div className="text-right text-[13.5px] font-medium text-slate-700 flex items-center justify-end gap-1">
                담당부서: <span className="font-bold">{department?.name || "미지정"}</span>
              </div>
            </div>
            
            {/* 조항 렌더링 */}
            {currentRevision?.articles && currentRevision.articles.length > 0 ? (
              <div className="pb-32">
                {(() => {
                  const cumulativeSeenSets: Set<string>[] = [];
                  const currentRunningSet = new Set<string>();
                  
                  if (currentRevision?.articles) {
                    for (const a of currentRevision.articles) {
                      cumulativeSeenSets.push(new Set(currentRunningSet));
                      if (!isAddendumArticle(a)) continue;
                      
                      let items: any[] = [];
                      if (typeof a.contentJson === "string") {
                        try { 
                          const parsed = JSON.parse(a.contentJson); 
                          items = Array.isArray(parsed) ? parsed : (parsed.paragraphs ? parsed.paragraphs : [parsed]);
                        } catch (e) {}
                      } else if (a.contentJson) {
                        items = Array.isArray(a.contentJson) ? a.contentJson : (a.contentJson.paragraphs ? a.contentJson.paragraphs : [a.contentJson]);
                      }
                      if (!Array.isArray(items)) items = [];
                      
                      const rawLines: string[] = [];
                      for (const item of items) {
                        if (!item) continue;
                        let raw = String(item.text || "").trim();
                        if (!raw) continue;
                        raw = raw.replace(/^(?:부\s*칙\s*)+/, "").trim();
                        if (raw) rawLines.push(raw);
                      }
                      let fullText = rawLines.join("\n");
                      if (!fullText && a.contentText) {
                        fullText = a.contentText.replace(/^(?:부\s*칙\s*)+/, "").trim();
                      }
                      
                      const lines = fullText.split('\n');
                      for (const line of lines) {
                        const currentLine = line.trim();
                        if (currentLine === "") continue;
                        
                        let coreText = currentLine;
                        const match1 = currentLine.match(/^(?:부칙\s*)?제\d+조(?:의\s*\d+)?\s*\([^)]*\)\s*(.*)/);
                        if (match1) {
                          coreText = match1[1].trim();
                        } else {
                          const match2 = currentLine.match(/^(?:부칙\s*)?제\d+조(?:의\s*\d+)?\s+(.*)/);
                          if (match2) coreText = match2[1].trim();
                        }
                        coreText = coreText.replace(/^[①-⑳\d]+[.)]?\s*/, '').trim();
                        const normalizedCore = coreText.replace(/\s+/g, '').replace(/[.·]/g, '');
                        // Add all lines > 15 chars to running set. No title check needed because it only filters future articles!
                        if (normalizedCore && normalizedCore.length > 15) {
                          currentRunningSet.add(normalizedCore);
                        }
                      }
                    }
                  }

                  return currentRevision.articles.map((a: any, idx: number) => {
                  const hasHtmlAttachments = currentRevision?.articles?.some((art: any) => art.articleNumber >= 9000) || false;
                  // [버그 수정]: "연혁 숨기기"가 켜져있을 때 본문이 "삭제" 연혁 뿐인 조항(결번 껍데기)이 화면에 노출되는 버그(중복 노출 오인) 수정
                  if (hideHistory && isDeletedOnly(a.contentText)) {
                    return null;
                  }
                  
                  // 별지/별표/별첨 (9000번대) 조항은 더 이상 본문 하단에 HTML로 렌더링하지 않음 (첨부파일 컴포넌트로 대체)
                  const isLegacyAddendum = a.articleNumber >= 9000 && isAddendumArticle(a);
                  if (a.articleNumber >= 9000 && !isLegacyAddendum) return null;

                  const prevA = currentRevision.articles[idx - 1];
                  const nextA = currentRevision.articles[idx + 1];
                  let chapterInJson = false;
                  let sectionInJson = false;
                  try {
                    const parsed = typeof a.contentJson === 'string' ? JSON.parse(a.contentJson) : a.contentJson;
                    if (Array.isArray(parsed)) {
                      if (parsed.some((i: any) => i.type === 'chapter')) chapterInJson = true;
                      if (parsed.some((i: any) => i.type === 'section')) sectionInJson = true;
                    }
                  } catch (e) {}

                  const showChapter = a.chapter && (!prevA || prevA.chapter !== a.chapter) && !chapterInJson
                    && !/^부\s*칙/.test((a.chapter || '').replace(/\s+/g, '')); // 부칙 chapter는 장 헤더 억제
                  const showSection = a.section && (!prevA || prevA.section !== a.section) && !sectionInJson;

                  const trailingTitles: string[] = [];
                  if (nextA) {
                    if (a.chapter !== nextA.chapter && nextA.chapter) trailingTitles.push(nextA.chapter);
                    if (a.section !== nextA.section && nextA.section) trailingTitles.push(nextA.section);
                  }

                  return (
                    <React.Fragment key={a.id}>
                      {showChapter && (
                        <div id={`toc-${a.chapter.split('\n')[0].trim().replace(/\s/g, '-')}`} className="text-center w-full mt-8 mb-6 pt-2 flex flex-col items-center gap-1.5">
                          {(() => {
                            const historyRegex = /([<(\[＜（](?:개정|제정|신설|삭제|본조신설|전문개정|전부개정|일부개정|단서신설|후단신설|단서삭제|장\s*변경|조\s*폐지|변경|폐지|표개정|조이동|조신설|항신설|호신설|목신설|표이동|본문이동|캠퍼스명칭변경|명칭변경|서식개정|서식신설|별표개정|별지개정|[가-힣\s,･]+개정|[가-힣\s,･]+신설|[가-힣\s,･]+이동|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?)(?:[^>\])＞）]*\d+[^>\])＞）]*|[\s]*)[>\])＞）])/gi;
                            const histories = a.chapter.match(historyRegex);
                            let mainTitle = a.chapter;
                            let historyPart = "";
                            if (histories && histories.length > 0) {
                              mainTitle = a.chapter.replace(historyRegex, '').trim();
                              historyPart = histories.join('');
                            }
                            
                            const lines = mainTitle.split('\n');
                            if (historyPart) {
                              const normalizeHistoryDate = (str: string) => {
                                let inner = str.replace(/^[<(\[]|[)>\]]$/g, '').trim();
                                let parts = inner.split(',').map(p => p.trim());
                                let lastAction = '';
                                let normParts = parts.map(part => {
                                  let match = part.match(/^(개정|제정|신설|삭제|본조신설|전문개정|전부개정|일부개정|단서신설|후단신설|단서삭제|장\s*변경|조\s*폐지|변경|폐지|표개정|조이동|조신설|항신설|호신설|목신설|표이동|본문이동|캠퍼스명칭변경|명칭변경|서식개정|서식신설|별표개정|별지개정|[가-힣\s,･]+개정|[가-힣\s,･]+신설|[가-힣\s,･]+이동)?\s*(.*)$/);
                                  if (!match) return part;
                                  let action = match[1];
                                  let dateStr = match[2];
                                  if (action) lastAction = action;
                                  else action = lastAction || '개정';
                                  let dateNorm = dateStr.replace(/[^\d.]/g, '').split('.').map(s => s.trim()).filter(s => s.length > 0).map(s => parseInt(s, 10)).join('. ');
                                  if (dateNorm) dateNorm += '.';
                                  else dateNorm = dateStr;
                                  return action + ' ' + dateNorm;
                                });
                                return '<' + normParts.join(', ') + '>';
                              };
                              lines.push(normalizeHistoryDate(historyPart));
                            }
                            return lines.map((line: string, i: number) => {
                              const isHistoryLine = i > 0 && /^[<(\[＜（]/.test(line.trim());
                              return (
                                <span key={i} className={!isHistoryLine ? "text-[20px] font-black text-[#000080] tracking-tight break-keep" : "text-[13px] text-sky-700 font-medium"}>
                                  {line}
                                </span>
                              );
                            });
                          })()}
                        </div>
                      )}
                      {showSection && (
                        <div id={`toc-${a.section.split('\n')[0].trim().replace(/\s/g, '-')}`} className="text-center w-full mt-6 mb-4 flex flex-col items-center gap-1">
                          {(() => {
                            const historyRegex = /([<(\[＜（](?:개정|제정|신설|삭제|본조신설|전문개정|전부개정|일부개정|단서신설|후단신설|단서삭제|장\s*변경|조\s*폐지|변경|폐지|표개정|조이동|조신설|항신설|호신설|목신설|표이동|본문이동|캠퍼스명칭변경|명칭변경|서식개정|서식신설|별표개정|별지개정|[가-힣\s,･]+개정|[가-힣\s,･]+신설|[가-힣\s,･]+이동|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?)(?:[^>\])＞）]*\d+[^>\])＞）]*|[\s]*)[>\])＞）])/gi;
                            const histories = a.section.match(historyRegex);
                            let mainTitle = a.section;
                            let historyPart = "";
                            if (histories && histories.length > 0) {
                              mainTitle = a.section.replace(historyRegex, '').trim();
                              historyPart = histories.join('');
                            }
                            
                            const lines = mainTitle.split('\n');
                            if (historyPart) {
                              const normalizeHistoryDate = (str: string) => {
                                let inner = str.replace(/^[<(\[]|[)>\]]$/g, '').trim();
                                let parts = inner.split(',').map(p => p.trim());
                                let lastAction = '';
                                let normParts = parts.map(part => {
                                  let match = part.match(/^(개정|제정|신설|삭제|본조신설|전문개정|전부개정|일부개정|단서신설|후단신설|단서삭제|장\s*변경|조\s*폐지|변경|폐지|표개정|조이동|조신설|항신설|호신설|목신설|표이동|본문이동|캠퍼스명칭변경|명칭변경|서식개정|서식신설|별표개정|별지개정|[가-힣\s,･]+개정|[가-힣\s,･]+신설|[가-힣\s,･]+이동)?\s*(.*)$/);
                                  if (!match) return part;
                                  let action = match[1];
                                  let dateStr = match[2];
                                  if (action) lastAction = action;
                                  else action = lastAction || '개정';
                                  let dateNorm = dateStr.replace(/[^\d.]/g, '').split('.').map(s => s.trim()).filter(s => s.length > 0).map(s => parseInt(s, 10)).join('. ');
                                  if (dateNorm) dateNorm += '.';
                                  else dateNorm = dateStr;
                                  return action + ' ' + dateNorm;
                                });
                                return '<' + normParts.join(', ') + '>';
                              };
                              lines.push(normalizeHistoryDate(historyPart));
                            }
                            return lines.map((line: string, i: number) => {
                              const isHistoryLine = i > 0 && /^[<(\[＜（]/.test(line.trim());
                              return (
                                <span key={i} className={!isHistoryLine ? "text-[18px] font-bold text-[#000080] break-keep" : "text-[12px] text-sky-700 font-medium"}>
                                  {line}
                                </span>
                              );
                            });
                          })()}
                        </div>
                      )}
                      {/* 부칙 묶음 구분선 및 묶음 소속 여부 판별 */}
                      {(() => {
                        let separator: React.ReactNode = null;
                        if (isAddendumArticle(a)) {
                          const pa = idx > 0 ? currentRevision?.articles?.[idx - 1] : null;
                          const prevIsAddendum = pa ? isAddendumArticle(pa) : false;
                          
                          let isBundleStart = false;
                          if (!prevIsAddendum) {
                            isBundleStart = true;
                          } else {
                            const currTitle = a.title || a.contentText || "";
                            const isCurrJustBuchik = /^부\s*칙/.test(currTitle) && !/제\d+조/.test(currTitle);
                            const isCurrArticle1 = /제1조/.test(currTitle);
                            
                            const prevTitle = pa.title || pa.contentText || "";
                            const isPrevJustBuchik = /^부\s*칙/.test(prevTitle) && !/제\d+조/.test(prevTitle);
                            
                            if (isCurrJustBuchik || (isCurrArticle1 && !isPrevJustBuchik)) {
                              isBundleStart = true;
                            }
                          }
                          if (isBundleStart) {
                            separator = <div className="w-full mt-10 mb-6 border-t border-dashed border-slate-400" />;
                          }
                        }
                        return separator;
                      })()}
                      {(() => {
                        let isBundleChild = false;
                        if (isAddendumArticle(a)) {
                          const pa = idx > 0 ? currentRevision?.articles?.[idx - 1] : null;
                          const prevIsAddendum = pa ? isAddendumArticle(pa) : false;
                          if (prevIsAddendum) {
                            const currTitle = a.title || a.contentText || "";
                            const isCurrJustBuchik = /^부\s*칙/.test(currTitle) && !/제\d+조/.test(currTitle);
                            const isCurrArticle1 = /제1조/.test(currTitle);
                            
                            const prevTitle = pa.title || pa.contentText || "";
                            const isPrevJustBuchik = /^부\s*칙/.test(prevTitle) && !/제\d+조/.test(prevTitle);
                            
                            if (!(isCurrJustBuchik || (isCurrArticle1 && !isPrevJustBuchik))) {
                              isBundleChild = true;
                            }
                          }
                        }
                        
                        
                        // Check if this article is COMPLETELY a headless duplicate
                        let isCompletelyHeadlessDuplicate = false;
                        if (isAddendumArticle(a)) {
                          let items: any[] = [];
                          if (typeof a.contentJson === "string") {
                            try { 
                              const parsed = JSON.parse(a.contentJson); 
                              items = Array.isArray(parsed) ? parsed : (parsed.paragraphs ? parsed.paragraphs : [parsed]);
                            } catch (e) {}
                          } else if (a.contentJson) {
                            items = Array.isArray(a.contentJson) ? a.contentJson : (a.contentJson.paragraphs ? a.contentJson.paragraphs : [a.contentJson]);
                          }
                          
                          if (!Array.isArray(items)) items = [];
                          
                          const rawLines: string[] = [];
                          for (const item of items) {
                            if (!item) continue;
                            let raw = String(item.text || "").trim();
                            if (!raw) continue;
                            raw = raw.replace(/^(?:부\s*칙\s*)+/, "").trim();
                            if (raw) rawLines.push(raw);
                          }
                          let fullText = rawLines.join("\n");
                          if (!fullText && a.contentText) {
                            fullText = a.contentText.replace(/^(?:부\s*칙\s*)+/, "").trim();
                          }
                          
                          const lines = fullText.split('\n');
                          let hasAnyTitle = false;
                          let allLinesAreDuplicates = true;
                          let validLinesCount = 0;
                          
                          for (const line of lines) {
                            if (line.trim() === "") continue;
                            if (/^(?:부칙\s*)?제\d+조/.test(line.trim())) {
                                hasAnyTitle = true;
                                break;
                            }
                            
                            validLinesCount++;
                            const normalizedCore = line.trim().replace(/^[①-⑳\d]+[.)]?\s*/, '').replace(/\s+/g, '').replace(/[.·]/g, '');
                            if (normalizedCore && normalizedCore.length > 10) {
                              let found = false;
                              for (const seen of cumulativeSeenSets[idx]) {
                                if (normalizedCore.startsWith(seen) || seen.startsWith(normalizedCore)) {
                                  found = true;
                                  break;
                                }
                              }
                              if (!found) {
                                allLinesAreDuplicates = false;
                                break;
                              }
                            } else {
                              allLinesAreDuplicates = false;
                              break;
                            }
                          }
                          
                          // If it doesn't have ANY title in its text, and ALL its lines are found in seen texts, it's a headless duplicate!
                          if (!hasAnyTitle && validLinesCount > 0 && allLinesAreDuplicates) {
                            isCompletelyHeadlessDuplicate = true;
                          }
                        }

                        if (isCompletelyHeadlessDuplicate) {
                          return null;
                        }

                        // [버그 수정]: "연혁 숨기기" 상태일 때 본문에서도 삭제 전용 조항을 렌더링하지 않음
                        if (hideHistory && isDeletedOnly(a.contentText)) {
                          return null;
                        }
                        
                        return (
                          <ArticleRenderer
                        id={(() => {
                          if (a.articleNumber >= 8000) return `toc-${a.articleNumber}`;
                          const expectedTitleStart = `제${a.articleNumber}조`;
                          let titleStr = (a.title || '').trim();
                          if (titleStr && !/^제\d+조/.test(titleStr)) {
                             if (/^의\s*\d+/.test(titleStr)) {
                                titleStr = `${expectedTitleStart}${titleStr}`;
                             } else {
                                titleStr = `${expectedTitleStart}(${titleStr})`;
                             }
                          } else if (!titleStr) {
                             titleStr = expectedTitleStart;
                          }
                          const match = titleStr.match(/^(제\d+조(?:의|\s+)?\d*)/);
                          if (match) {
                            let numPart = match[1].replace(/\s/g, '');
                            if (numPart.match(/^제\d+조\d+$/)) {
                              numPart = numPart.replace(/조(\d+)$/, '조의$1');
                            }
                            return `toc-${numPart}`;
                          }
                          return `toc-${a.articleNumber}`;
                        })()}
                        articleId={a.id}
                        chapter={a.chapter}
                        section={a.section}
                        articleNumber={isLegacyAddendum ? 8999 : a.articleNumber}
                        title={a.title}
                        contentJson={a.contentJson}
                        contentText={a.contentText}
                        contentHtml={a.contentHtml}
                        hideHistory={hideHistory}
                        hasHtmlAttachments={hasHtmlAttachments}
                        isAdmin={isAdmin}
                        trailingTitles={trailingTitles}
                        isBundleChild={isBundleChild}
                        seenAddendumCoreTexts={cumulativeSeenSets[idx]}
                        ruleTitle={cleanTitle || ruleData?.title || ""}
                        searchKeyword={activeSearchKeyword}
                        isSelectedForPrint={selectedArticlesForPrint.has(a.id)}
                        onTogglePrintSelect={(id, checked) => {
                          setSelectedArticlesForPrint(prev => {
                            const newSet = new Set(prev);
                            if (checked) newSet.add(id);
                            else newSet.delete(id);
                            return newSet;
                          });
                        }}
                      />
                    );
                  })()}
                    </React.Fragment>
                  );
                });
              })()}

                {/* Attachments Section */}
                {/* Attachments Section */}
                {attachments && attachments.length > 0 && (() => {
                  const sortedAttachments = [...attachments].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                  const groups = Object.values(
                    sortedAttachments.reduce((acc: any, file: any) => {
                      const baseName = file.title
                        .replace(/\.[^/.]+$/, "")
                        .replace(/\(최종\)$/i, "")
                        .replace(/[\u200B-\u200D\uFEFF]/g, "")
                        .trim()
                        .replace(/\s+/g, " ");
                      if (!acc[baseName]) acc[baseName] = { baseName, files: [] };
                      acc[baseName].files.push(file);
                      return acc;
                    }, {})
                  ) as any[];

                  const mainGroups = groups.filter((g: any) => g.baseName.includes("[전문]") || (!g.baseName.includes("[별표") && !g.baseName.includes("[별지") && !g.baseName.includes("[서식") && !g.baseName.includes("[별첨")));
                  const otherGroups = groups.filter((g: any) => !mainGroups.includes(g));

                  const renderGroup = (group: any, idx: number, isMain: boolean = false) => {
                      let pdfFile = group.files.find((f: any) => f.fileType?.toLowerCase() === "pdf" || f.title.toLowerCase().endsWith(".pdf"));
                      const hwpFile = group.files.find((f: any) => f.fileType?.toLowerCase() === "hwp" || f.title.toLowerCase().endsWith(".hwp"));
                      const xlsFile = group.files.find((f: any) => f.fileType?.toLowerCase().startsWith("xls") || f.title.toLowerCase().endsWith(".xls") || f.title.toLowerCase().endsWith(".xlsx"));
                      
                      const getDownloadUrl = (file: any) => {
                        let fullTitle = file.title || "download";
                        if (file.fileType && !fullTitle.toLowerCase().endsWith(`.${file.fileType.toLowerCase()}`)) {
                          fullTitle += `.${file.fileType}`;
                        }
                        const encodedTitle = encodeURIComponent(fullTitle);
                        if (file.fileUrl.startsWith('/api/files/')) {
                          return `${file.fileUrl}?download=true&filename=${encodedTitle}`;
                        }
                        return `/api/download?fileUrl=${encodeURIComponent(file.fileUrl)}&filename=${encodedTitle}`;
                      };

                      const getInlineUrl = (file: any) => {
                        const encodedTitle = encodeURIComponent(file.title);
                        if (file.fileUrl.startsWith('/api/files/')) {
                          return `${file.fileUrl}?filename=${encodedTitle}`;
                        }
                        if (file.fileUrl.startsWith('http')) {
                          return file.fileUrl;
                        }
                        return `/api/download?fileUrl=${encodeURIComponent(file.fileUrl)}&inline=true&filename=${encodedTitle}`;
                      };
                      
                      const isExpanded = !isMain && !!expandedAttachments[group.baseName];

                      return (
                        <div id={`toc-attach-${group.baseName}`} key={idx} className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-sm">
                          {/* Accordion Header */}
                          <div 
                            className={`bg-[#f8fafc] hover:bg-white p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 select-none border-b border-slate-200 transition-all ${isMain ? '' : 'cursor-pointer'}`}
                            onClick={() => !isMain && setExpandedAttachments(prev => ({ ...prev, [group.baseName]: !isExpanded }))}
                          >
                            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 flex-1">
                              {/* 모바일 1행: 미리보기 버튼 + 뱃지 */}
                              <div className="flex items-center gap-2.5">
                                {!isMain && (
                                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-black border shadow-sm transition-all ${isExpanded ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400'}`}>
                                    <svg className="w-3.5 h-3.5 shrink-0 text-[#f43f5e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="11" cy="11" r="8"></circle>
                                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    </svg>
                                    <span>미리보기</span>
                                    <span className="flex items-center justify-center opacity-80">
                                      {isExpanded ? <KeyboardArrowUpIcon sx={{ fontSize: 14 }} /> : <KeyboardArrowDownIcon sx={{ fontSize: 14 }} />}
                                    </span>
                                  </div>
                                )}

                                {(() => {
                                  const raw = group.baseName;
                                  const detailedMatch = raw.match(/^\[(?:별지|별표|별첨|서식)\]\s*([\d\-]+\s+)\[([^\]]+)\]\s*(.*)$/);
                                  if (detailedMatch) {
                                    const badgeText = detailedMatch[2];
                                    const badgeColor = badgeText.includes('별표') ? 'bg-rose-600 text-white border-rose-600/20' : 'bg-[#3498db] text-white border-[#3498db]/20';
                                    return (
                                      <span className={`px-3 py-1.5 rounded-xl text-xs md:text-sm font-black border whitespace-nowrap shadow-sm ${badgeColor}`}>
                                        {badgeText}
                                      </span>
                                    );
                                  }
                                  const basicMatch = raw.match(/^\[([^\]]+)\]\s*(.*)$/);
                                  if (basicMatch) {
                                    const type = basicMatch[1];
                                    return (
                                      <span className={`px-3 py-1.5 rounded-xl text-xs md:text-sm font-black border whitespace-nowrap shadow-sm ${
                                        type.includes('전문') ? 'bg-slate-600 text-white border-slate-600/20' :
                                        type.includes('별표') ? 'bg-rose-600 text-white border-rose-600/20' :
                                        'bg-[#3498db] text-white border-[#3498db]/20'
                                      }`}>
                                        {type}
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>

                              {/* 모바일 2행 (엔터) / 데스크톱 이어지는 영역: 제목 */}
                              <div className="font-extrabold text-slate-800 text-[16px] md:text-[17px] tracking-tight leading-snug break-keep flex-1 mt-1 md:mt-0">
                                {(() => {
                                  const raw = group.baseName;
                                  const detailedMatch = raw.match(/^\[(?:별지|별표|별첨|서식)\]\s*([\d\-]+\s+)\[([^\]]+)\]\s*(.*)$/);
                                  if (detailedMatch) {
                                    const ruleNum = detailedMatch[1].trim();
                                    const fileName = detailedMatch[3];
                                    return `${ruleNum} ${fileName}`;
                                  }
                                  const basicMatch = raw.match(/^\[([^\]]+)\]\s*(.*)$/);
                                  if (basicMatch) {
                                    return basicMatch[2];
                                  }
                                  return raw;
                                })()}
                              </div>
                            </div>

                            {/* 하단 / 데스크톱 우측: 다운로드 버튼 및 새창 열기 그룹 */}
                            <div className="flex items-center justify-end gap-2 shrink-0 border-t border-slate-200/80 md:border-t-0 pt-3 md:pt-0" onClick={(e) => e.stopPropagation()}>
                              {hwpFile && (
                                <a href={getDownloadUrl(hwpFile)} download={true} target="_blank" className="bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 hover:bg-blue-100 transition-colors shadow-sm" title="HWP 다운로드">
                                  <ArticleIcon sx={{ fontSize: 16 }} /> HWP
                                </a>
                              )}
                              {pdfFile && (
                                <a href={getDownloadUrl(pdfFile)} download={true} target="_blank" className="bg-red-50 border border-red-200 text-red-700 px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 hover:bg-red-100 transition-colors shadow-sm" title="PDF 다운로드">
                                  <PictureAsPdfIcon sx={{ fontSize: 16 }} /> PDF
                                </a>
                              )}
                              {xlsFile && (
                                <a href={getDownloadUrl(xlsFile)} download={true} target="_blank" className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 hover:bg-emerald-100 transition-colors shadow-sm" title="EXCEL 다운로드">
                                  <FactCheckIcon sx={{ fontSize: 16 }} /> EXCEL
                                </a>
                              )}
                              {pdfFile && (
                                <a href={getInlineUrl(pdfFile)} target="_blank" className="text-slate-400 hover:text-slate-600 transition-colors ml-2 flex items-center justify-center p-1" title="새 창에서 열기">
                                  <LaunchIcon sx={{ fontSize: 18 }} />
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Accordion Body (PDF Viewer) */}
                          {!isMain && isExpanded && (
                            <div className="bg-slate-100 p-0 w-full" style={{ height: "800px" }}>
                              {pdfFile ? (
                                <iframe 
                                  src={`${getInlineUrl(pdfFile)}#toolbar=0`} 
                                  className="w-full h-full border-none"
                                  title={group.baseName}
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full text-slate-400 font-bold flex-col gap-2">
                                  <ArticleIcon sx={{ fontSize: 48, color: "#cbd5e1" }} />
                                  PDF 파일이 제공되지 않는 서식입니다. 상단에서 HWP 파일을 다운로드하세요.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    };

                    return (
                      <>
                        {mainGroups.length > 0 && (
                          <div id="toc-main-attachments" className="mt-16 w-full">
                            <div className="flex items-center gap-2 mb-6 border-b-2 border-slate-300 pb-3">
                              <ArticleIcon className="text-emerald-600" sx={{ fontSize: 24 }} />
                              <h3 className="text-[20px] font-black text-[#004000] tracking-tight">규정 전문</h3>
                            </div>
                            <div className="space-y-4">
                              {mainGroups.sort((a, b) => compareAttachmentNames(a.baseName, b.baseName)).map((g, i) => renderGroup(g, i, true))}
                            </div>
                          </div>
                        )}
                        
                        {otherGroups.length > 0 && (
                          <div id="toc-attachments" className={mainGroups.length > 0 ? "mt-12 w-full" : "mt-16 w-full"}>
                            <div className="flex items-center gap-2 mb-6 border-b-2 border-slate-300 pb-3">
                              <ArticleIcon className="text-blue-700" sx={{ fontSize: 24 }} />
                              <h3 className="text-[20px] font-black text-[#000080] tracking-tight">별표 및 별지 (별첨)</h3>
                            </div>
                            <div className="space-y-4">
                              {otherGroups.sort((a, b) => compareAttachmentNames(a.baseName, b.baseName)).map((g, i) => renderGroup(g, i, false))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
            ) : (
              <div className="text-center py-20 text-slate-400">조항 내용이 없습니다.</div>
            )}

            
            {/* Scroll Buttons */}
            <div className="fixed top-1/2 -translate-y-1/2 right-6 flex flex-col gap-2 z-50">
              <button
                onClick={handleScrollTop}
                className="w-10 h-10 rounded-full bg-[#009b9e] text-white shadow-lg flex items-center justify-center hover:bg-[#008285] transition-all hover:-translate-y-1 active:scale-95 opacity-80 hover:opacity-100 cursor-pointer"
                title="맨 위로 한 번에 이동"
              >
                <KeyboardArrowUpIcon fontSize="medium" />
              </button>
              <button
                onClick={handleScrollBottom}
                className="w-10 h-10 rounded-full bg-[#009b9e] text-white shadow-lg flex items-center justify-center hover:bg-[#008285] transition-all hover:translate-y-1 active:scale-95 opacity-80 hover:opacity-100 cursor-pointer"
                title="맨 아래로 한 번에 이동"
              >
                <KeyboardArrowDownIcon fontSize="medium" />
              </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
// trigger redeploy
