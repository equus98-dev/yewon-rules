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
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentRevision = ruleData?.currentRevision;

  const tocItems = useMemo(() => {
    if (!currentRevision || !currentRevision.articles) return [];
    let toc: any[] = [];
    let lastChapter = "";
    let lastSection = "";
    
    currentRevision.articles.forEach((a: any) => {
        if (a.chapter && a.chapter !== lastChapter) {
            const cleanChapter = a.chapter.replace(/설치(?:\s*|󰂛?)운영(?:\s*|󰂛?)폐지/g, '설치·운영·폐지');
            toc.push({ type: "chapter", id: `toc-${a.articleNumber}`, text: cleanChapter });
            lastChapter = a.chapter;
        }
        if (a.section && a.section !== lastSection) {
            toc.push({ type: "section", id: `toc-${a.articleNumber}`, text: a.section });
            lastSection = a.section;
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
            const regex = /(제\d+조의?\d*\([^)]+\))/g;
            let match;
            let foundArticle = false;
            while ((match = regex.exec(textToScan)) !== null) {
              const fullTitle = match[1];
              const articleNumMatch = fullTitle.match(/^(제\d+조의?\d*)/);
              const articleNum = articleNumMatch ? articleNumMatch[1] : fullTitle;
              if (!toc.some(t => t.id === `toc-${articleNum}`)) {
                toc.push({ type: "article", id: `toc-${articleNum}`, text: fullTitle });
                foundArticle = true;
              }
            }
            if (!foundArticle && a.articleNumber < 8000 && a.title) {
              const expectedTitleStart = `제${a.articleNumber}조`;
              const titleStr = /^제\d+조/.test(a.title.trim()) ? a.title.trim() : `${expectedTitleStart}(${a.title.trim()})`;
              toc.push({ type: "article", id: `toc-${a.articleNumber}`, text: titleStr });
            }
          } else if (a.articleNumber < 8000 && a.title) {
            const expectedTitleStart = `제${a.articleNumber}조`;
            const titleStr = /^제\d+조/.test(a.title.trim()) ? a.title.trim() : `${expectedTitleStart}(${a.title.trim()})`;
            toc.push({ type: "article", id: `toc-${a.articleNumber}`, text: titleStr });
          }
          return;
        }

        // 부칙 (8000번대)인 경우 하위 조항을 TOC에 개별적으로 넣지 않고 '부칙' 하나만 추가
        if (a.articleNumber >= 8000 && a.articleNumber < 9000) {
           if (!toc.some(t => t.text.replace(/\s+/g, '') === "부칙")) {
               toc.push({ type: "chapter", id: `toc-${a.articleNumber}`, text: "부칙" });
           }
           
           // HTML 별지가 없는 경우 부칙 내의 텍스트 기반 별지를 스캔하여 TOC에 추가
           const hasHtmlAttachments = currentRevision.articles.some((art: any) => art.articleNumber >= 9000);
           if (!hasHtmlAttachments) {
              const textAttachments = items.filter((item: any) => {
                 if (!item || !item.text) return false;
                 return /^(?:\[|〔)(별지|별표|서식)/.test(String(item.text).trim());
              });
              if (textAttachments.length > 0) {
                 if (!toc.some(t => t.id === "toc-attachments")) {
                    toc.push({ type: "chapter", id: "toc-attachments", text: "별지 목록" });
                 }
                 textAttachments.forEach((item: any, i: number) => {
                    let safeText = String(item.text).trim();
                    safeText = safeText.replace(/^〔/, '[').replace(/〕$/, ']'); // TOC 표시용 괄호 정규화
                    toc.push({ type: "attachment", id: `toc-text-attach-${a.articleNumber}-${i}`, text: safeText });
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
           const titleStr = /^제\d+조/.test(a.title.trim()) ? a.title.trim() : `${expectedTitleStart}(${a.title.trim()})`;
           const titleMatch = titleStr.match(/^(제\d+조의?\d*)/);
           if (titleMatch) {
              const titleNum = titleMatch[1];
              if (!toc.some(t => t.id === `toc-${titleNum}`)) {
                 toc.push({ type: "article", id: `toc-${titleNum}`, text: titleStr });
              }
           }
        }

        items.forEach((item: any) => {
          if (!item) return;
          
          if (typeof item === 'string') {
            const regex = /(제\d+조의?\d*\([^)]+\))/g;
            let match;
            while ((match = regex.exec(item)) !== null) {
              const fullTitle = match[1];
              const articleNumMatch = fullTitle.match(/^(제\d+조의?\d*)/);
              const articleNum = articleNumMatch ? articleNumMatch[1] : fullTitle;
              if (!toc.some(t => t.id === `toc-${articleNum}`)) {
                toc.push({ type: "article", id: `toc-${articleNum}`, text: fullTitle });
              }
            }
            return;
          }
          
          if (typeof item !== 'object') return;
          
          if (item.type === "chapter") {
            const chapterText = typeof item.text === 'string' ? item.text.replace(/설치(?:\s*|󰂛?)운영(?:\s*|󰂛?)폐지/g, '설치·운영·폐지') : String(item.text || "");
            if (toc.length > 0 && toc[toc.length - 1].type === "chapter" && toc[toc.length - 1].text === chapterText) return;
            toc.push({ type: "chapter", id: `toc-${chapterText.replace(new RegExp("\\s", "g"), '-')}`, text: chapterText });
          } else if (item.type === "section") {
            const sectionText = typeof item.text === 'string' ? item.text : String(item.text || "");
            if (toc.length > 0 && toc[toc.length - 1].type === "section" && toc[toc.length - 1].text === sectionText) return;
            toc.push({ type: "section", id: `toc-${sectionText.replace(new RegExp("\\s", "g"), '-')}`, text: sectionText });
          } else if (item.type === "article") {
            const articleNum = typeof item.num === 'string' ? item.num : String(item.num || "");
            toc.push({ type: "article", id: `toc-${articleNum}`, text: articleNum });
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
            while ((match = regex.exec(safeText)) !== null) {
              const fullTitle = match[1];
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
    
    // Add attachments from articles to TOC
    const attachmentArticles = currentRevision.articles.filter((a: any) => a.articleNumber >= 9000);
    if (attachmentArticles.length > 0) {
      toc.push({ type: "chapter", id: "toc-attachments", text: "별지 목록" });
      attachmentArticles.forEach((a: any) => {
        toc.push({ type: "attachment", id: `toc-${a.articleNumber}`, text: a.title });
      });
    }
    
    return toc;
  }, [currentRevision, ruleData?.attachments]);

  // 규정 데이터 패치 (선택한 버전 포함)
  useEffect(() => {
    async function loadRule() {
      if (!ruleId) return;
      setLoading(true);
      try {
        let url = `/api/rules/${ruleId}`;
        if (selectedVersion !== null) {
          url += `?version=${selectedVersion}`;
        }
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
  }, [ruleId, selectedVersion]);

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

  // 버전을 직접 클릭하여 해당 버전의 본문을 로딩
  const handleVersionSelect = (verNum: number) => {
    setSelectedVersion(verNum);
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden relative border border-slate-200">
      
      {/* 1. 상단 타이틀 및 브레드크럼 */}
      <div className="bg-[#009b9e]/[0.12] border-b border-slate-200 px-6 py-4 shrink-0 flex items-center justify-between z-10 shadow-sm relative">
        <h1 className="text-2xl font-black text-[#007073] tracking-tight ml-2">{title}</h1>
        <div className="text-[14px] text-slate-500 font-medium tracking-wider">
          HOME &gt; 전자규정집 &gt; {category?.name || "분류"} &gt; <span className="font-bold text-slate-700">{title}</span>
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
        <div className="flex items-center gap-1.5 flex-wrap">
          <button className="flex items-center gap-1 px-2.5 py-1 border border-blue-200 bg-white text-blue-700 text-[11px] font-bold rounded hover:bg-blue-50 transition-colors cursor-pointer">
            <FileDownloadIcon sx={{ fontSize: 14 }} /> 다운로드
          </button>
          <button className="flex items-center gap-1 px-2.5 py-1 border border-slate-300 bg-white text-slate-700 text-[11px] font-bold rounded hover:bg-slate-50 transition-colors cursor-pointer">
            <InfoIcon sx={{ fontSize: 14 }} className="text-blue-500" /> 개정정보
          </button>
          <button className="flex items-center gap-1 px-2.5 py-1 border border-slate-300 bg-white text-slate-700 text-[11px] font-bold rounded hover:bg-slate-50 transition-colors cursor-pointer">
            <ArticleIcon sx={{ fontSize: 14 }} className="text-slate-400" /> 개정문
          </button>
          <button className="flex items-center gap-1 px-2.5 py-1 border border-slate-300 bg-white text-slate-700 text-[11px] font-bold rounded hover:bg-slate-50 transition-colors cursor-pointer">
            <ArticleIcon sx={{ fontSize: 14 }} className="text-emerald-500" /> 기안문
          </button>
          <button className="flex items-center gap-1 px-2.5 py-1 border border-slate-300 bg-white text-slate-700 text-[11px] font-bold rounded hover:bg-slate-50 transition-colors cursor-pointer">
            <CompareArrowsIcon sx={{ fontSize: 14 }} className="text-purple-500" /> 신구대비표
          </button>
          <button className="flex items-center gap-1 px-2.5 py-1 border border-slate-300 bg-white text-slate-700 text-[11px] font-bold rounded hover:bg-slate-50 transition-colors cursor-pointer">
            <ArticleIcon sx={{ fontSize: 14 }} className="text-slate-600" /> 2단보기
          </button>
          <button className="flex items-center gap-1 px-2.5 py-1 border border-slate-300 bg-white text-slate-700 text-[11px] font-bold rounded hover:bg-slate-50 transition-colors cursor-pointer">
            <ArticleIcon sx={{ fontSize: 14 }} className="text-blue-500" /> 전체보기
          </button>
        </div>
      </div>

      {/* 3. 2단 분할 본문 영역 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 좌측 목차 (TOC) */}
        <div className="w-[320px] bg-white border-r border-slate-200 overflow-y-auto scrollbar shrink-0 flex flex-col">
          <div className="px-4 py-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2 sticky top-0 z-10">
            <HistoryIcon className="text-blue-700" sx={{ fontSize: 16 }} />
            <span className="font-bold text-sm text-slate-800">목차 ({tocItems.filter(i => i.type === 'article').length})</span>
          </div>
          <ul className="p-3 space-y-1.5">
            {tocItems.map((item, idx) => {
              let itemClass = "px-3 py-1 text-slate-600 hover:text-blue-700 hover:font-bold hover:bg-slate-50 cursor-pointer text-[13px] flex gap-1 transition-all";
              if (item.type === "chapter") {
                itemClass = "mt-4 mb-2 px-2 py-1.5 bg-slate-50 border-y border-slate-200 font-bold text-slate-700 text-[13px] tracking-tight";
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
              
              return (
              <li key={idx} className={itemClass}>
                <a href={`#${item.id}`} className="block w-full" onClick={(e) => {
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

        {/* 우측 본문 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar bg-white p-10 relative scroll-smooth">
          <div className="max-w-4xl mx-auto mt-4">
            {/* 규정 제목 */}
            <h2 className="text-[26px] font-black text-center text-[#007073] mb-8 tracking-tight break-keep">{title}</h2>
            
            {/* 법령 정보 (시행일, 담당부서) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 border-b-2 border-slate-700 pb-3 gap-3">
              <div className="text-[14px] font-medium text-[#1E5D9B]">
                [시행 {currentRevision?.effectiveDate ? new Date(currentRevision.effectiveDate).toLocaleDateString('ko-KR') : (currentRevision?.enactmentDate ? new Date(currentRevision.enactmentDate).toLocaleDateString('ko-KR') : "미정")}] 
                [{currentRevision?.revisionType ? getRevisionTypeName(currentRevision.revisionType) : ""}{currentRevision?.enactmentDate ? ` ${new Date(currentRevision.enactmentDate).toLocaleDateString('ko-KR')}` : ""}]
              </div>
              <div className="text-right text-[13.5px] font-medium text-slate-700 flex items-center justify-end gap-1">
                담당부서: <span className="font-bold">{department?.name || "미지정"}</span>
              </div>
            </div>
            
            {/* 조항 렌더링 */}
            {currentRevision?.articles && currentRevision.articles.length > 0 ? (
              <div className="pb-32">
                {currentRevision.articles.map((a: any) => {
                  const hasHtmlAttachments = currentRevision?.articles?.some((art: any) => art.articleNumber >= 9000) || false;
                  
                  return (
                    <ArticleRenderer
                      key={a.id}
                      id={`toc-${a.articleNumber}`}
                      articleId={a.id}
                      chapter={a.chapter}
                      section={a.section}
                      articleNumber={a.articleNumber}
                      title={a.title}
                      contentJson={a.contentJson}
                      contentText={a.contentText}
                      contentHtml={a.contentHtml}
                      hideHistory={hideHistory}
                      hasHtmlAttachments={hasHtmlAttachments}
                      isAdmin={isAdmin}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400">조항 내용이 없습니다.</div>
            )}
            
            {/* 맨위로 가기 버튼 */}
            <button 
              onClick={() => {
                if (scrollRef.current) {
                  scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="fixed bottom-8 right-10 z-50 bg-white border border-slate-200 text-slate-500 shadow hover:shadow-md hover:text-[#0c3161] hover:border-blue-200 p-2.5 rounded-full transition-all group flex items-center justify-center cursor-pointer"
              title="맨위로 이동"
            >
              <KeyboardArrowUpIcon />
            </button>
            
          </div>
        </div>
      </div>
    </div>
  );
}
