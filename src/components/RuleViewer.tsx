"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
    title === "부칙" ||
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
  const [isTocOpen, setIsTocOpen] = useState(true);
  const [expandedAttachments, setExpandedAttachments] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const tocScrollRef = useRef<HTMLDivElement>(null);
  const [activeTocId, setActiveTocId] = useState<string>("");
  const [popupState, setPopupState] = useState<{ isOpen: boolean; title: string; isLoading?: boolean; error?: string | null; articleData?: any; url?: string }>({ isOpen: false, title: "" });
  
  const [isDownloadPopupOpen, setIsDownloadPopupOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
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

  const [manualCitationData, setManualCitationData] = useState<{
    selectedText: string;
    articleId: string;
    position: { top: number; left: number };
  } | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isManualModalSaving, setIsManualModalSaving] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setIsSelectMode(params.get('selectMode') === 'true');
    }
  }, []);

  const handleScrollTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    tocScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleScrollBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current?.scrollHeight || 99999, behavior: "smooth" });
    tocScrollRef.current?.scrollTo({ top: tocScrollRef.current?.scrollHeight || 99999, behavior: "smooth" });
  };

  const currentRevision = ruleData?.currentRevision;

  const calculatedEnactmentDateStr = useMemo(() => {
    if (!ruleData) return "미정";

    // 1. Check if there's any explicit ENACTMENT revision in history
    if (ruleData.revisions && Array.isArray(ruleData.revisions)) {
      const enactmentRev = ruleData.revisions.find((r: any) => r.revisionType === 'ENACTMENT');
      if (enactmentRev && enactmentRev.enactmentDate) {
        const d = new Date(enactmentRev.enactmentDate);
        if (!isNaN(d.getTime())) return d.toLocaleDateString('ko-KR');
      }
    }

    // 2. Scan '부칙' (Addendum) to find the oldest date
    if (currentRevision && currentRevision.articles && Array.isArray(currentRevision.articles)) {
      const addenda = currentRevision.articles.filter(isAddendumArticle);
      let oldestDate: Date | null = null;
      const dateRegex = /(19|20)\d{2}\s*(년|\.)\s*\d{1,2}\s*(월|\.)\s*\d{1,2}\s*(일|\.)?/g;

      for (const a of addenda) {
        let textToScan = a.contentText || "";
        if (!textToScan && a.contentJson) {
          try {
            const parsed = typeof a.contentJson === "string" ? JSON.parse(a.contentJson) : a.contentJson;
            if (Array.isArray(parsed)) {
              textToScan = parsed.map(i => i.text || "").join(" ");
            } else if (parsed.paragraphs) {
              textToScan = parsed.paragraphs.join(" ");
            }
          } catch (e) {}
        }

        let match;
        while ((match = dateRegex.exec(textToScan)) !== null) {
          const rawMatch = match[0].replace(/[년월일\s]/g, '.');
          const parts = rawMatch.split('.').filter(p => p.length > 0).map(Number);
          if (parts.length >= 3) {
            const d = new Date(parts[0], parts[1] - 1, parts[2]);
            if (!isNaN(d.getTime())) {
              if (!oldestDate || d < oldestDate) {
                oldestDate = d;
              }
            }
          }
        }
      }

      if (oldestDate) {
        return oldestDate.toLocaleDateString('ko-KR');
      }
    }

    return "미정";
  }, [ruleData, currentRevision]);

  const tocItems = useMemo(() => {
    if (!currentRevision || !currentRevision.articles) return [];
    let toc: any[] = [];
    let lastChapter = "";
    let lastSection = "";
    
    currentRevision.articles.forEach((a: any) => {
        if (a.chapter && a.chapter !== lastChapter) {
            // 부칙 chapter는 가운데 장 헤더로 표시하지 않음 (ArticleRenderer에서 통합 처리)
            if (!/^부\s*칙/.test((a.chapter || '').replace(/\s+/g, ''))) {
              const historyRegexPattern = /([<(\[＜（](?:개정|제정|신설|삭제|본조신설|전문개정|단서신설|후단신설|장\s*변경|조\s*폐지|변경|폐지|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?)(?:[^>\])＞）]*\d+[^>\])＞）]*|[\s]*)[>\])＞）])/gi;
              const cleanChapter = a.chapter.replace(/설치.{0,2}운영.{0,2}폐지/gu, '설치·운영·폐지').replace(historyRegexPattern, '').trim();
              toc.push({ type: "chapter", id: `toc-${a.articleNumber}`, text: cleanChapter });
            }
            lastChapter = a.chapter;
        }
        if (a.section && a.section !== lastSection) {
            const historyRegexPattern = /([<(\[＜（](?:개정|제정|신설|삭제|본조신설|전문개정|단서신설|후단신설|장\s*변경|조\s*폐지|변경|폐지|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?)(?:[^>\])＞）]*\d+[^>\])＞）]*|[\s]*)[>\])＞）])/gi;
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

        // DB Migration 중 본문에서 유실된 제1조 제목 강제 복구 (TOC용)
        if (a.title && a.articleNumber < 8000) {
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

           const titleMatch = formattedTitleStr.match(/^(제\d+조의?\s*\d*)/);
           if (titleMatch) {
              const titleNum = titleMatch[1].replace(/\s/g, '');
              if (!toc.some(t => t.id === `toc-${titleNum}`)) {
                 toc.push({ type: "article", id: `toc-${titleNum}`, text: formattedTitleStr });
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
              }
            }
            return;
          }
          
          if (typeof item !== 'object') return;
          
          const historyRegexPattern = /([<(\[＜（](?:개정|제정|신설|삭제|본조신설|전문개정|단서신설|후단신설|장\s*변경|조\s*폐지|변경|폐지|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?)(?:[^>\])＞）]*\d+[^>\])＞）]*|[\s]*)[>\])＞）])/gi;
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
            if (!toc.some(t => t.id === `toc-${articleNum}`)) {
              toc.push({ type: "article", id: `toc-${articleNum}`, text: articleNum });
            }
          } else if (item.type === "text" || item.type === "paragraph" || item.type === "item" || item.type === "subitem") {
            const safeText = String(item.text || "");
            if (/^제\d+관/.test(safeText.trim())) {
              const subsectionText = safeText.trim();
              if (toc.length > 0 && toc[toc.length - 1].type === "subsection" && toc[toc.length - 1].text === subsectionText) return;
              toc.push({ type: "subsection", id: `toc-${subsectionText.replace(new RegExp("\\s", "g"), '-')}`, text: subsectionText });
            }
            // Extract glued articles: "제N조(제목)"
            const regex = /(제\d+조의?\d*\([^)]+\))/g;
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
              const articleNumMatch = fullTitle.match(/^(제\d+조의?\d*)/);
              const articleNum = articleNumMatch ? articleNumMatch[1] : fullTitle;
              
              // Avoid duplicates (if multiple same articles referenced)
              if (!toc.some(t => t.id === `toc-${articleNum}`)) {
                toc.push({ type: "article", id: `toc-${articleNum}`, text: fullTitle });
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
        const baseName = a.title.replace(/\.[^/.]+$/, "");
        if (!uniqueBaseNames.has(baseName)) {
           uniqueBaseNames.add(baseName);
        }
      });

      const mainFiles = Array.from(uniqueBaseNames).filter((name: any) => name.includes("[전문]"));
      const subFiles = Array.from(uniqueBaseNames).filter((name: any) => !name.includes("[전문]")).sort((a: any, b: any) => a.localeCompare(b, 'ko', { numeric: true }));

      if (mainFiles.length > 0) {
         if (!toc.some((t: any) => t.id === "toc-main-files")) {
            toc.push({ type: "chapter", id: "toc-main-files", text: "현 규정 다운로드" });
         }
         mainFiles.forEach((baseName: string) => {
            const match = baseName.match(/\[(.*?)\]/);
            const displayText = match ? match[1] : baseName;
            toc.push({ type: "attachment", id: `toc-attach-${baseName}`, text: displayText });
         });
      }

      if (subFiles.length > 0) {
         if (!toc.some((t: any) => t.id === "toc-attachments")) {
            toc.push({ type: "chapter", id: "toc-attachments", text: "별표/별지/별첨 목록" });
         }
         subFiles.forEach((baseName: string) => {
            const displayText = baseName;
            toc.push({ type: "attachment", id: `toc-attach-${baseName}`, text: displayText });
         });
      }
    }
    
    return toc;
  }, [currentRevision, ruleData?.attachments]);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      const scrollY = scrollRef.current.scrollTop;
      
      let currentActiveId = "";
      for (let i = 0; i < tocItems.length; i++) {
        const item = tocItems[i];
        const el = document.getElementById(item.id);
        if (el) {
          // Adjust offset to trigger slightly before the element hits the top
          const offsetTop = el.offsetTop - 150; 
          if (scrollY >= offsetTop) {
            currentActiveId = item.id;
          } else {
            // Since tocItems are in order, we can break early once we find an element below the scroll position
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
      <div className="bg-[#009b9e]/[0.12] border-b border-slate-200 px-6 py-4 shrink-0 flex items-center justify-between z-10 shadow-sm relative">
        <h1 className="text-2xl font-black text-[#007073] tracking-tight ml-2">{ruleNumber ? `${ruleNumber} ` : ""}{cleanTitle}</h1>
        <div className="text-[14px] text-slate-500 font-medium tracking-wider">
          HOME &gt; 전자규정집 &gt; {category?.name || "분류"} &gt; <span className="font-bold text-slate-700">{cleanTitle}</span>
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
              className="px-2 py-1 text-xs outline-none w-[160px]"
            />
            <button className="px-2 py-1 text-blue-700 bg-slate-50 border-l border-slate-300 hover:bg-slate-100 font-black cursor-pointer text-xs">Q</button>
            <button className="px-1.5 py-1 text-slate-500 bg-slate-50 border-l border-slate-300 hover:bg-slate-100 text-xs font-black cursor-pointer">&lt;</button>
            <button className="px-1.5 py-1 text-slate-500 bg-slate-50 border-l border-slate-300 hover:bg-slate-100 text-xs font-black cursor-pointer">&gt;</button>
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
                    const encodedTitle = encodeURIComponent(file.title);
                    if (file.fileUrl?.startsWith('/api/files/')) {
                      return `${file.fileUrl}?filename=${encodedTitle}`;
                    }
                    if (file.fileUrl?.startsWith('http')) {
                      return file.fileUrl;
                    }
                    return `/api/download?fileUrl=${encodeURIComponent(file.fileUrl || "")}&filename=${encodedTitle}`;
                  };
                  
                  const isMainFile = (title: string) => title.includes("[전문]") || (!title.includes("[별표") && !title.includes("[별지") && !title.includes("[서식") && !title.includes("[별첨"));
                  const mainRuleHwp = ruleData?.attachments?.find((f: any) => isMainFile(f.title) && (f.fileType?.toLowerCase() === "hwp" || f.title.toLowerCase().endsWith(".hwp")));
                  const mainRulePdf = ruleData?.attachments?.find((f: any) => isMainFile(f.title) && (f.fileType?.toLowerCase() === "pdf" || f.title.toLowerCase().endsWith(".pdf")));
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
          
          <button 
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 border border-slate-300 bg-white text-slate-700 text-[11px] font-bold rounded hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <InfoIcon sx={{ fontSize: 14 }} className="text-blue-500" /> 개정정보
          </button>
          
          <button 
            onClick={() => window.open(`/compare?ruleId=${ruleId}`, "_blank", "width=1200,height=800,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes")}
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
        <div className="relative z-30 flex items-center h-full w-0">
          <button
            onClick={() => setIsTocOpen(!isTocOpen)}
            className="absolute -left-px w-4 h-10 bg-[#007073] hover:bg-[#005a5c] text-white flex items-center justify-center rounded-r-lg shadow-md cursor-pointer transition-colors border border-l-0 border-[#005a5c] active:scale-95"
            title={isTocOpen ? "목차 닫기" : "목차 열기"}
          >
            {isTocOpen ? <KeyboardArrowLeftIcon sx={{ fontSize: 13 }} /> : <KeyboardArrowRightIcon sx={{ fontSize: 13 }} />}
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar bg-white p-10 relative scroll-smooth">
          <div className="max-w-4xl mx-auto mt-4 relative">
            {/* 규정 제목 */}
            <h2 className="text-[26px] font-black text-center text-[#007073] mb-8 tracking-tight break-keep">{cleanTitle}</h2>
            
            {/* 법령 정보 (시행일, 담당부서) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 border-b-2 border-slate-700 pb-3 gap-3">
              <div className="text-[14px] font-medium text-[#1E5D9B]">
                [시행 {currentRevision?.effectiveDate ? new Date(currentRevision.effectiveDate).toLocaleDateString('ko-KR') : (currentRevision?.enactmentDate ? new Date(currentRevision.enactmentDate).toLocaleDateString('ko-KR') : "미정")}] 
                [제정 {calculatedEnactmentDateStr}]
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
                  const seenAddendumCoreTexts = new Set<string>();
                  if (currentRevision?.articles) {
                    for (const a of currentRevision.articles) {
                      if (!isAddendumArticle(a)) continue;
                      
                      let items: any[] = [];
                      if (typeof a.contentJson === "string") {
                        try { items = JSON.parse(a.contentJson); } catch (e) {}
                      } else if (a.contentJson) {
                        items = Array.isArray(a.contentJson) ? a.contentJson : (a.contentJson.paragraphs ? a.contentJson.paragraphs : [a.contentJson]);
                      }
                      
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
                        coreText = coreText.replace(/^[①-⑮\d]+\.\s*/, '').trim();
                        const normalizedCore = coreText.replace(/\s+/g, '').replace(/[.·]/g, '');
                        // ONLY add to seen if it actually HAS a title!
                        if (normalizedCore && normalizedCore.length > 10 && /^(?:부칙\s*)?제\d+조/.test(currentLine)) {
                          seenAddendumCoreTexts.add(normalizedCore);
                        }
                      }
                    }
                  }

                  return currentRevision.articles.map((a: any, idx: number) => {
                  const hasHtmlAttachments = currentRevision?.articles?.some((art: any) => art.articleNumber >= 9000) || false;
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
                            const historyRegex = /([<(\[＜（](?:개정|제정|신설|삭제|본조신설|전문개정|단서신설|후단신설|장\s*변경|조\s*폐지|변경|폐지|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?)(?:[^>\])＞）]*\d+[^>\])＞）]*|[\s]*)[>\])＞）])/gi;
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
                                  let match = part.match(/^(개정|제정|신설|삭제|본조신설|전문개정|단서신설|후단신설|변경)?\s*(.*)$/);
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
                            const historyRegex = /([<(\[＜（](?:개정|제정|신설|삭제|본조신설|전문개정|단서신설|후단신설|장\s*변경|조\s*폐지|변경|폐지|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?)(?:[^>\])＞）]*\d+[^>\])＞）]*|[\s]*)[>\])＞）])/gi;
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
                                  let match = part.match(/^(개정|제정|신설|삭제|본조신설|전문개정|단서신설|후단신설|변경)?\s*(.*)$/);
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
                            try { items = JSON.parse(a.contentJson); } catch (e) {}
                          } else if (a.contentJson) {
                            items = Array.isArray(a.contentJson) ? a.contentJson : (a.contentJson.paragraphs ? a.contentJson.paragraphs : [a.contentJson]);
                          }
                          
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
                            const normalizedCore = line.trim().replace(/^[①-⑮\d]+\.\s*/, '').replace(/\s+/g, '').replace(/[.·]/g, '');
                            if (normalizedCore && normalizedCore.length > 10) {
                              let found = false;
                              for (const seen of seenAddendumCoreTexts) {
                                if (seen.includes(normalizedCore) || normalizedCore.includes(seen)) {
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
                        seenAddendumCoreTexts={seenAddendumCoreTexts}
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
                  const groups = Object.values(
                    attachments.reduce((acc: any, file: any) => {
                      const baseName = file.title.replace(/\.[^/.]+$/, "");
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
                      
                      const getDownloadUrl = (file: any) => {
                        const encodedTitle = encodeURIComponent(file.title);
                        if (file.fileUrl.startsWith('/api/files/')) {
                          return `${file.fileUrl}?download=true&filename=${encodedTitle}`;
                        }
                        if (file.fileUrl.startsWith('http')) {
                          return `${file.fileUrl}?download=${encodedTitle}`;
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
                            className={`bg-slate-50 flex items-center justify-between px-4 py-3 select-none border-b border-slate-200 transition-colors ${isMain ? '' : 'hover:bg-slate-100 cursor-pointer'}`}
                            onClick={() => !isMain && setExpandedAttachments(prev => ({ ...prev, [group.baseName]: !isExpanded }))}
                          >
                            <div className="flex items-center gap-2">
                              {!isMain && (
                                <span className="text-slate-500 flex items-center justify-center">
                                  {isExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                                </span>
                              )}
                              {(() => {
                                const match = group.baseName.match(/^\[([^\]]+)\]\s*(.*)$/);
                                if (match) {
                                  const type = match[1];
                                  const displayText = match[2];
                                  return (
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 rounded text-[12px] font-black border whitespace-nowrap ${
                                        type.includes('전문') ? 'bg-slate-600/80 text-white border-slate-600/20' :
                                        type.includes('별표') ? 'bg-rose-600/80 text-white border-rose-600/20' :
                                        'bg-sky-600/80 text-white border-sky-600/20'
                                      }`}>
                                        {type}
                                      </span>
                                      <span className="font-bold text-slate-800 text-[15px]">{displayText}</span>
                                    </div>
                                  );
                                }
                                return <span className="font-bold text-slate-800 text-[15px]">{group.baseName}</span>;
                              })()}
                                <div className="flex items-center gap-1.5 ml-3" onClick={(e) => e.stopPropagation()}>
                                  {hwpFile && (
                                    <a href={getDownloadUrl(hwpFile)} download={true} target="_blank" className="bg-blue-50 border border-blue-200 text-blue-700 px-1.5 py-0.5 rounded text-[11px] font-black flex items-center gap-0.5 hover:bg-blue-100 transition-colors" title="HWP 다운로드">
                                      <ArticleIcon sx={{ fontSize: 14 }} /> HWP
                                    </a>
                                  )}
                                  {pdfFile && (
                                    <a href={getDownloadUrl(pdfFile)} download={true} target="_blank" className="bg-red-50 border border-red-200 text-red-700 px-1.5 py-0.5 rounded text-[11px] font-black flex items-center gap-0.5 hover:bg-red-100 transition-colors" title="PDF 다운로드">
                                      <PictureAsPdfIcon sx={{ fontSize: 14 }} /> PDF
                                    </a>
                                  )}
                                  {pdfFile && (
                                    <a href={getInlineUrl(pdfFile)} target="_blank" className="text-slate-400 hover:text-slate-600 transition-colors ml-1 flex items-center justify-center" title="새 창에서 열기">
                                      <LaunchIcon sx={{ fontSize: 16 }} />
                                    </a>
                                  )}
                                </div>
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
                              {mainGroups.sort((a, b) => a.baseName.localeCompare(b.baseName)).map((g, i) => renderGroup(g, i, true))}
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
                              {otherGroups.sort((a, b) => a.baseName.localeCompare(b.baseName)).map((g, i) => renderGroup(g, i, false))}
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

      {/* 4. 개정정보 모달 */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsHistoryModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-lg">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <InfoIcon className="text-blue-600" /> 연혁
              </h2>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-0 overflow-y-auto flex-1">
              {ruleData?.revisions?.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {ruleData.revisions.map((rev: any, index: number) => {
                    const date = rev.enactmentDate && !isNaN(new Date(rev.enactmentDate).getTime()) 
                                   ? new Date(rev.enactmentDate).toLocaleDateString() : "날짜없음";
                    return (
                      <div key={rev.version} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="text-blue-600 font-bold text-[15px] mt-0.5">{ruleData.revisions.length - index}.</div>
                          <div>
                            <h3 className="font-bold text-slate-800 mb-1.5 text-[15px]">{ruleData.title}</h3>
                            <p className="text-[13px] text-slate-500 font-medium break-keep">
                              [시행 {date}] [{ruleData.department ? ruleData.department.name : "소관부서미상"}... 제{rev.version}호, {date}, {getRevisionTypeName(rev.revisionType)}]
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 font-bold text-sm">개정정보가 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
