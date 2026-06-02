"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CircularProgress, Typography } from "@mui/material";
import ArticleRenderer from "./ArticleRenderer";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import HistoryIcon from "@mui/icons-material/History";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import ArticleIcon from "@mui/icons-material/Article";
import InfoIcon from "@mui/icons-material/Info";

interface RuleViewerProps {
  ruleId: string;
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

export default function RuleViewer(props: RuleViewerProps) {
  return (
    <RuleViewerErrorBoundary>
      <RuleViewerInner {...props} />
    </RuleViewerErrorBoundary>
  );
}

function RuleViewerInner({ ruleId }: RuleViewerProps) {
  // 1. 상태 및 훅은 모두 최상단에 선언
  const [loading, setLoading] = useState(false);
  const [ruleData, setRuleData] = useState<any>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [hideHistory, setHideHistory] = useState(false);

  const currentRevision = ruleData?.currentRevision;

  const tocItems = useMemo(() => {
    if (!currentRevision || !currentRevision.articles) return [];
    let toc: any[] = [];
    currentRevision.articles.forEach((a: any) => {
      try {
        let items = typeof a.contentJson === "string" ? JSON.parse(a.contentJson) : a.contentJson;
        if (!Array.isArray(items)) return;
        items.forEach((item: any) => {
          if (!item || typeof item !== 'object') return;
          if (item.type === "chapter") {
            const chapterText = typeof item.text === 'string' ? item.text : String(item.text || "");
            toc.push({ type: "chapter", id: `toc-${chapterText.replace(new RegExp("\\s", "g"), '-')}`, text: chapterText });
          } else if (item.type === "article") {
            const articleNum = typeof item.num === 'string' ? item.num : String(item.num || "");
            toc.push({ type: "article", id: `toc-${articleNum}`, text: articleNum });
          }
        });
      } catch (e) {
        console.error("TOC parsing error", e);
      }
    });
    return toc;
  }, [currentRevision]);

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
        const data = await res.json();
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

  // ruleId가 바뀔 때마다 버전 초기화
  useEffect(() => {
    setSelectedVersion(null);
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
      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 flex items-center justify-between z-10 shadow-sm relative">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight ml-2">{title}</h1>
        <div className="text-[11px] text-slate-500 font-medium tracking-wider">
          HOME &gt; 전자규정집 &gt; {category?.name || "분류"} &gt; {title}
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
                  : "날짜없음"} {rev.revisionType || '개정'}
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
            {tocItems.map((item, idx) => (
              <li key={idx} className={item.type === "chapter" ? "mt-4 mb-2 px-2 py-1.5 bg-slate-50 border-y border-slate-200 font-bold text-slate-700 text-[13px] tracking-tight" : "px-3 py-1 text-slate-600 hover:text-blue-700 hover:font-bold hover:bg-slate-50 cursor-pointer text-[13px] flex gap-1 transition-all"}>
                <a href={`#${item.id}`} className="block w-full" onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}>
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* 우측 본문 */}
        <div className="flex-1 overflow-y-auto scrollbar bg-white p-10 relative">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-[13px] font-bold text-slate-600 select-none hover:text-blue-700">
                <input 
                  type="checkbox" 
                  checked={hideHistory} 
                  onChange={() => setHideHistory(!hideHistory)}
                  className="w-4 h-4 cursor-pointer accent-blue-600"
                />
                연혁숨기기
              </label>
              
              <div className="text-right text-[13px] font-bold text-slate-500 flex items-center gap-1">
                <InfoIcon sx={{ fontSize: 16 }} className="text-[#0c3161]" />
                담당부서: <span className="text-slate-800">{department?.name || "미지정"}</span>
              </div>
            </div>

            <h2 className="text-[34px] font-black text-center text-slate-900 mb-14 tracking-tight mt-6">{title}</h2>
            
            {/* 조항 렌더링 */}
            {currentRevision?.articles && currentRevision.articles.length > 0 ? (
              <div className="pb-32">
                {currentRevision.articles.map((article: any) => (
                  <ArticleRenderer
                    key={article.id}
                    id={article.id}
                    chapter={article.chapter}
                    section={article.section}
                    articleNumber={article.articleNumber}
                    title={article.title}
                    contentJson={article.contentJson}
                    contentHtml={article.contentHtml}
                    hideHistory={hideHistory}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 text-slate-400 font-bold text-lg">
                등록된 조항 정보가 존재하지 않습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
