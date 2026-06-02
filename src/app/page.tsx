"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { TextField, Button, Box, Paper, Typography, CircularProgress, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import HomeIcon from "@mui/icons-material/Home";
import GavelIcon from "@mui/icons-material/Gavel";
import CampaignIcon from "@mui/icons-material/Campaign";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import SidebarTree from "@/components/SidebarTree";
import RuleViewer from "@/components/RuleViewer";
import Link from "next/link";

export default function Home() {
  const [activeRuleId, setActiveRuleId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  
  // 1. 상세 검색을 위한 상태 정의 (NSU 스타일)
  const [scope, setScope] = useState<"current" | "history">("current");
  const [optionAll, setOptionAll] = useState(true);
  const [optionTitle, setOptionTitle] = useState(false);
  const [optionBody, setOptionBody] = useState(false);
  const [optionAttachment, setOptionAttachment] = useState(false);
  const [enactmentStart, setEnactmentStart] = useState("");
  const [enactmentEnd, setEnactmentEnd] = useState("");
  const [sidebarKey, setSidebarKey] = useState(0);
  const [resultActiveTab, setResultActiveTab] = useState<"all" | "title" | "body" | "attachment">("all");

  // 대시보드용 최신 제개정 목록
  const [recentRules, setRecentRules] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // 실시간 공지사항 연동을 위한 상태 정의
  const [notices, setNotices] = useState<any[]>([]);
  const [loadingNotices, setLoadingNotices] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<any | null>(null);
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);

  // 공지사항 로드 함수
  const loadNotices = async () => {
    setLoadingNotices(true);
    try {
      const res = await fetch("/api/notices");
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotices(data);
      }
    } catch (error) {
      console.error("Failed to load notices:", error);
    } finally {
      setLoadingNotices(false);
    }
  };

  // 대시보드 로드 시 최신 제개정 규정 및 공지사항 패치
  useEffect(() => {
    async function loadRecentRules() {
      setLoadingRecent(true);
      try {
        const res = await fetch("/api/rules/search?query=");
        const data = await res.json();
        if (Array.isArray(data)) {
          // enactmentDate 기준 최근순으로 5개만 노출
          const sorted = data.sort(
            (a: any, b: any) => new Date(b.enactmentDate).getTime() - new Date(a.enactmentDate).getTime()
          );
          setRecentRules(sorted.slice(0, 5));
        }
      } catch (error) {
        console.error("Failed to load recent rules:", error);
      } finally {
        setLoadingRecent(false);
      }
    }
    loadRecentRules();
    loadNotices();
  }, []);

  // 검색 옵션 토글 핸들러
  const handleToggleAll = (checked: boolean) => {
    setOptionAll(checked);
    if (checked) {
      setOptionTitle(false);
      setOptionBody(false);
      setOptionAttachment(false);
    }
  };

  const handleToggleOption = (type: "title" | "body" | "attachment", checked: boolean) => {
    if (type === "title") setOptionTitle(checked);
    if (type === "body") setOptionBody(checked);
    if (type === "attachment") setOptionAttachment(checked);

    if (checked) {
      setOptionAll(false);
    } else {
      const t = type === "title" ? false : optionTitle;
      const b = type === "body" ? false : optionBody;
      const a = type === "attachment" ? false : optionAttachment;
      if (!t && !b && !a) {
        setOptionAll(true);
      }
    }
  };

  // 개정기간 퀵 버튼 핸들러 (1주, 1달, 1년)
  const handleQuickDate = (period: "1w" | "1m" | "1y") => {
    const today = new Date();
    const start = new Date();
    
    if (period === "1w") {
      start.setDate(today.getDate() - 7);
    } else if (period === "1m") {
      start.setMonth(today.getMonth() - 1);
    } else if (period === "1y") {
      start.setFullYear(today.getFullYear() - 1);
    }
    
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    setEnactmentStart(formatDate(start));
    setEnactmentEnd(formatDate(today));
  };

  // 통합 검색 실행 핸들러 (고도화 버전)
  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryToSearch = customQuery !== undefined ? customQuery : searchQuery;

    setLoadingSearch(true);
    setIsSearching(true);
    setActiveRuleId(null); // 검색 결과 뷰 활성화
    setResultActiveTab("all"); // 결과 탭 '전체'로 초기화
    
    try {
      // 검색 옵션 빌드
      const optionList: string[] = [];
      if (optionAll) {
        optionList.push("all");
      } else {
        if (optionTitle) optionList.push("title");
        if (optionBody) optionList.push("body");
        if (optionAttachment) optionList.push("attachment");
      }
      if (optionList.length === 0) optionList.push("all");

      const params = new URLSearchParams();
      params.append("query", queryToSearch);
      params.append("scope", scope);
      params.append("options", optionList.join(","));
      if (enactmentStart) params.append("enactmentStart", enactmentStart);
      if (enactmentEnd) params.append("enactmentEnd", enactmentEnd);

      const res = await fetch(`/api/rules/search?${params.toString()}`);
      const data = await res.json();
      if (Array.isArray(data) || data.isGrouped) {
        setSearchResults(data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  // 홈으로 이동 (초기화)
  const handleGoHome = () => {
    setActiveRuleId(null);
    setIsSearching(false);
    setSearchQuery("");
    setSearchResults([]);
    setScope("current");
    setOptionAll(true);
    setOptionTitle(false);
    setOptionBody(false);
    setOptionAttachment(false);
    setEnactmentStart("");
    setEnactmentEnd("");
    setSidebarKey((prev) => prev + 1); // 사이드바 컴포넌트 세션 강제 초기화 트리거!
    setResultActiveTab("all"); // 결과 탭 '전체'로 초기화!
  };

  // 인기 태그 바로 검색 기능
  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    handleSearch(undefined, tag);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden text-slate-800">
      
      {/* ==================== 1. GNB 글로벌 네비게이션 헤더 ==================== */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 z-25 shrink-0 shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer" onClick={handleGoHome}>
          <Image
            src="/UI.png"
            alt="예원예술대학교 로고"
            width={183}
            height={40}
            className="h-10 w-auto object-contain"
          />
          <span className="text-blue-900 font-extrabold text-lg ml-2 border-l border-slate-300 pl-3.5 hidden sm:inline-block tracking-tight">
            규정관리시스템
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="text"
            color="primary"
            startIcon={<HomeIcon />}
            onClick={handleGoHome}
            className="font-bold text-sm text-slate-700 hover:text-blue-900"
          >
            홈으로
          </Button>

          {/* 관리자 로그인 버튼 추가 */}
          <Button
            component={Link}
            href="/admin"
            variant="contained"
            sx={{
              bgcolor: "#0c3161",
              "&:hover": { bgcolor: "#092244" },
              borderRadius: "8px",
              fontWeight: "bold",
              fontSize: "0.775rem",
              px: 2,
              py: 0.5,
              minHeight: "32px",
            }}
            className="font-bold text-xs active:scale-95 transition-all text-white font-sans"
          >
            관리자 로그인
          </Button>

          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Yewon Arts University Rule Management
          </span>
        </div>
      </header>

      {/* ==================== 2. 메인 컨텐츠 영역 ==================== */}
      <div className="flex-1 flex overflow-hidden bg-slate-50">
        
        {/* 좌측 사이드바 트리 (열기/닫기 가능한 슬라이딩 구조로 고도화 - 남색 세로 아이콘 메뉴바 상시 고정) */}
        <aside 
          className={`shrink-0 h-full hidden lg:block border-slate-200 z-10 transition-all duration-300 ease-in-out overflow-hidden ${
            isSidebarOpen ? "w-[375px] border-r" : "w-[75px] border-r"
          }`}
        >
          <div className="w-[375px] h-full">
            <SidebarTree
              key={sidebarKey}
              activeRuleId={activeRuleId}
              onSelectRule={(ruleId) => {
                const cleanId = ruleId.replace("cat-", "").replace("dept-", "").replace("abc-", "");
                setActiveRuleId(cleanId);
                setIsSearching(false); // 상세 보기 시 검색 결과 모드 해제
              }}
            />
          </div>
        </aside>

        {/* 우측 메인 영역 */}
        <main className="flex-1 h-full overflow-hidden bg-slate-100 flex flex-col relative">
          
          {/* 사이드바 접기/펴기 고급 세로 결합식 핸들 버튼 (프리미엄 윈도우 UI - 남색 테마 상단 배치) */}
          <div 
            className="absolute top-[84px] z-30 transition-all duration-300 ease-in-out hidden lg:block"
            style={{
              left: 0,
            }}
          >
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="bg-[#0c3161] hover:bg-[#092244] text-white w-5.5 h-20 rounded-r-2xl shadow-lg border-y border-r border-[#092244] active:scale-95 transition-all select-none cursor-pointer flex items-center justify-center"
              title={isSidebarOpen ? "규정구조도 접기" : "규정구조도 펼치기"}
            >
              {isSidebarOpen ? (
                <ArrowBackIosIcon sx={{ fontSize: 11, ml: 0.5, color: "white" }} />
              ) : (
                <ArrowForwardIosIcon sx={{ fontSize: 11, color: "white" }} />
              )}
            </button>
          </div>
          {activeRuleId ? (
            /* 규정 뷰어 표시 */
            <div className="flex-1 overflow-hidden">
              <RuleViewer ruleId={activeRuleId} />
            </div>
          ) : isSearching ? (
            /* 검색 결과 목록 표시 (남서울대 규정 통합 검색 스타일 그룹 대시보드) */
            <>
              {/* 1. 상단 슬림 가로 검색 폼 */}
              <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between gap-4 shrink-0 shadow-sm z-10">
                <form onSubmit={handleSearch} className="flex items-center flex-wrap gap-2.5 flex-1">
                  
                  {/* 검색영역 (Radio) */}
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs select-none">
                    <label className="flex items-center gap-1 cursor-pointer font-extrabold text-slate-700 text-[11px]">
                      <input
                        type="radio"
                        name="top-scope"
                        checked={scope === "current"}
                        onChange={() => setScope("current")}
                        className="w-3.5 h-3.5 cursor-pointer text-blue-600 focus:ring-blue-500"
                      />
                      현행
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer font-extrabold text-slate-700 text-[11px]">
                      <input
                        type="radio"
                        name="top-scope"
                        checked={scope === "history"}
                        onChange={() => setScope("history")}
                        className="w-3.5 h-3.5 cursor-pointer text-blue-600 focus:ring-blue-500"
                      />
                      연혁
                    </label>
                  </div>

                  {/* 개정기간 (Start ~ End) */}
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <input
                      type="date"
                      value={enactmentStart}
                      onChange={(e) => setEnactmentStart(e.target.value)}
                      className="border border-slate-300 rounded px-2 py-0.5 text-xs font-bold w-[125px] h-[28px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-slate-400">~</span>
                    <input
                      type="date"
                      value={enactmentEnd}
                      onChange={(e) => setEnactmentEnd(e.target.value)}
                      className="border border-slate-300 rounded px-2 py-0.5 text-xs font-bold w-[125px] h-[28px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* 옵션 Dropdown */}
                  <select
                    value={optionAll ? "all" : (optionTitle ? "title" : (optionBody ? "body" : "attachment"))}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "all") handleToggleAll(true);
                      else if (val === "title") handleToggleOption("title", true);
                      else if (val === "body") handleToggleOption("body", true);
                      else if (val === "attachment") handleToggleOption("attachment", true);
                    }}
                    className="border border-slate-300 rounded px-2 py-0.5 text-xs font-extrabold h-[28px] bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                  >
                    <option value="all">전체</option>
                    <option value="title">제목</option>
                    <option value="body">본문</option>
                    <option value="attachment">별표/별지</option>
                  </select>

                  {/* 검색어 인풋 및 버튼 */}
                  <div className="flex items-center flex-1 min-w-[200px]">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="검색어를 입력하십시오..."
                      className="flex-1 border border-slate-300 rounded-l px-3 py-1 text-xs font-bold h-[28px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="bg-[#009b9e] hover:bg-[#008082] text-white text-xs font-black px-4.5 h-[28px] rounded-r cursor-pointer active:scale-95 transition-all"
                    >
                      검색
                    </button>
                  </div>

                </form>

                {/* 우측 퀵 버튼 */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleTagClick("학칙")}
                    className="border border-slate-300 rounded px-3 py-1 text-xs font-extrabold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer flex items-center gap-1 h-[28px] active:scale-95 transition-all select-none"
                  >
                    🔤 가나다 검색
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDate("1m")}
                    className="border border-slate-300 rounded px-3 py-1 text-xs font-extrabold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer flex items-center gap-1 h-[28px] active:scale-95 transition-all select-none"
                  >
                    📅 개정일 검색
                  </button>
                </div>
              </div>

              {/* 2. 하단 메인 그룹별 검색결과 목록 대시보드 */}
              <div className="p-8 overflow-y-auto flex-1 bg-slate-50 scrollbar">
                <div className="max-w-5xl mx-auto">
                  
                  {/* 로딩 표시 */}
                  {loadingSearch ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                      <CircularProgress size={40} />
                      <span className="text-slate-500 text-xs font-semibold">데이터베이스 상세 인덱싱 검색중...</span>
                    </div>
                  ) : (
                    <>
                      {/* 타이틀 블록 */}
                      <div className="flex items-baseline justify-between border-b-2 border-slate-200 pb-3 mb-6 select-none">
                        <h1 className="text-[20px] font-black text-slate-800 tracking-tight flex items-center gap-2">
                          규정 통합 검색
                        </h1>
                        <span className="text-[11px] text-slate-400 font-bold tracking-wider">
                          HOME &gt; 규정 통합 검색
                        </span>
                      </div>

                      {/* 검색 결과 분할 헬퍼 데이터 구축 */}
                      {(() => {
                        const isGrouped = !Array.isArray(searchResults) && searchResults.isGrouped;
                        const titleList = isGrouped ? searchResults.titleMatches : (Array.isArray(searchResults) ? searchResults : []);
                        const bodyList = isGrouped ? searchResults.bodyMatches : [];
                        const attachmentList = isGrouped ? searchResults.attachmentMatches : [];
                        const totalCount = titleList.length + bodyList.length + attachmentList.length;

                        return (
                          <>
                            {/* 4대 결과 필터 탭 바 (남서울대 완벽 매칭) */}
                            <div className="flex border-b border-slate-200 mb-6 select-none shadow-sm rounded-lg overflow-hidden border">
                              <button
                                type="button"
                                onClick={() => setResultActiveTab("all")}
                                className={`flex-1 px-4 py-2.5 font-bold text-xs border-r border-slate-200 transition-all cursor-pointer text-center ${
                                  resultActiveTab === "all"
                                    ? "bg-[#0b3c5d] text-white"
                                    : "bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                전체({totalCount}건)
                              </button>
                              <button
                                type="button"
                                onClick={() => setResultActiveTab("title")}
                                className={`flex-1 px-4 py-2.5 font-bold text-xs border-r border-slate-200 transition-all cursor-pointer text-center ${
                                  resultActiveTab === "title"
                                    ? "bg-[#0b3c5d] text-white"
                                    : "bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                제목({titleList.length}건)
                              </button>
                              <button
                                type="button"
                                onClick={() => setResultActiveTab("body")}
                                className={`flex-1 px-4 py-2.5 font-bold text-xs border-r border-slate-200 transition-all cursor-pointer text-center ${
                                  resultActiveTab === "body"
                                    ? "bg-[#0b3c5d] text-white"
                                    : "bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                본문({bodyList.length}건)
                              </button>
                              <button
                                type="button"
                                onClick={() => setResultActiveTab("attachment")}
                                className={`flex-1 px-4 py-2.5 font-bold text-xs transition-all cursor-pointer text-center ${
                                  resultActiveTab === "attachment"
                                    ? "bg-[#0b3c5d] text-white"
                                    : "bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                별표/별지({attachmentList.length}건)
                              </button>
                            </div>

                            {/* 1) 규정명 매칭 섹션 */}
                            {(resultActiveTab === "all" || resultActiveTab === "title") && (
                              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 select-none">
                                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                                    <span className="text-[#009b9e] font-black">■</span> 규정명
                                    <span className="text-amber-600 font-bold ml-1">({titleList.length}건)</span>
                                  </h3>
                                  <button type="button" className="text-[10px] text-slate-400 font-bold border border-slate-200 rounded px-2.5 py-0.5 hover:bg-slate-50 cursor-pointer active:scale-95">
                                    + 더보기
                                  </button>
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs text-left border-collapse">
                                    <thead>
                                      <tr className="bg-slate-50/50 border-y border-slate-200 text-slate-600 select-none">
                                        <th className="py-2.5 px-3 font-extrabold w-14 text-center">번호</th>
                                        <th className="py-2.5 px-3 font-extrabold">제목</th>
                                        <th className="py-2.5 px-3 font-extrabold w-28 text-center">제/개정일</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {titleList.length === 0 ? (
                                        <tr>
                                          <td colSpan={3} className="py-8 text-center text-slate-400 font-bold bg-white">
                                            검색 결과가 없습니다.
                                          </td>
                                        </tr>
                                      ) : (
                                        titleList.map((rule: any, idx: number) => {
                                          const isAbolished = rule.status === "ABOLISHED";
                                          return (
                                            <tr
                                              key={rule.id}
                                              onClick={() => setActiveRuleId(rule.id)}
                                              className="border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-colors"
                                            >
                                              <td className="py-2.5 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                                              <td className="py-2.5 px-3 font-extrabold text-slate-800 hover:text-blue-700 transition-colors flex items-center gap-2">
                                                <span className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded text-[9px] font-black shrink-0 select-none">
                                                  {rule.departmentName}
                                                </span>
                                                <span className={`${isAbolished ? "line-through text-slate-400 font-semibold" : ""}`}>
                                                  {rule.title}
                                                </span>
                                                <span className="text-slate-400 font-bold text-[10px]">({rule.ruleNumber})</span>
                                              </td>
                                              <td className="py-2.5 px-3 text-center text-slate-500 font-bold">
                                                {rule.enactmentDate ? new Date(rule.enactmentDate).toLocaleDateString() : "-"}
                                              </td>
                                            </tr>
                                          );
                                        })
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* 2) 규정내용 매칭 섹션 */}
                            {(resultActiveTab === "all" || resultActiveTab === "body") && (
                              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 select-none">
                                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                                    <span className="text-[#009b9e] font-black">■</span> 규정내용
                                    <span className="text-amber-600 font-bold ml-1">({bodyList.length}건)</span>
                                  </h3>
                                  <button type="button" className="text-[10px] text-slate-400 font-bold border border-slate-200 rounded px-2.5 py-0.5 hover:bg-slate-50 cursor-pointer active:scale-95">
                                    + 더보기
                                  </button>
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs text-left border-collapse">
                                    <thead>
                                      <tr className="bg-slate-50/50 border-y border-slate-200 text-slate-600 select-none">
                                        <th className="py-2.5 px-3 font-extrabold w-14 text-center">번호</th>
                                        <th className="py-2.5 px-3 font-extrabold">제목/내용</th>
                                        <th className="py-2.5 px-3 font-extrabold w-28 text-center">제/개정일</th>
                                        <th className="py-2.5 px-3 font-extrabold w-16 text-center">보기</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {bodyList.length === 0 ? (
                                        <tr>
                                          <td colSpan={4} className="py-8 text-center text-slate-400 font-bold bg-white">
                                            검색 결과가 없습니다.
                                          </td>
                                        </tr>
                                      ) : (
                                        bodyList.map((match: any, idx: number) => (
                                          <tr
                                            key={idx}
                                            className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors"
                                          >
                                            <td className="py-3 px-3 text-center text-slate-400 font-bold align-middle">{idx + 1}</td>
                                            <td className="py-3 px-3 min-w-[300px]">
                                              <div className="font-extrabold text-slate-800 text-xs">
                                                {match.title} <span className="text-slate-400 font-bold"> &gt; {match.articleTitle}</span>
                                              </div>
                                              <div className="text-[11px] text-slate-600 mt-1.5 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-150 font-bold">
                                                {match.snippet}
                                              </div>
                                            </td>
                                            <td className="py-3 px-3 text-center text-slate-500 font-bold align-middle">
                                              {match.enactmentDate ? new Date(match.enactmentDate).toLocaleDateString() : "-"}
                                            </td>
                                            <td className="py-3 px-3 text-center align-middle">
                                              <button
                                                type="button"
                                                onClick={() => setActiveRuleId(match.id)}
                                                className="bg-[#009b9e] hover:bg-[#008082] text-white text-[10px] font-black px-2.5 py-1 rounded cursor-pointer active:scale-95 transition-all select-none shadow-sm"
                                              >
                                                보기
                                              </button>
                                            </td>
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* 3) 별표/별지 매칭 섹션 */}
                            {(resultActiveTab === "all" || resultActiveTab === "attachment") && (
                              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 select-none">
                                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                                    <span className="text-[#009b9e] font-black">■</span> 별표/별지
                                    <span className="text-amber-600 font-bold ml-1">({attachmentList.length}건)</span>
                                  </h3>
                                  <button type="button" className="text-[10px] text-slate-400 font-bold border border-slate-200 rounded px-2.5 py-0.5 hover:bg-slate-50 cursor-pointer active:scale-95">
                                    + 더보기
                                  </button>
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs text-left border-collapse">
                                    <thead>
                                      <tr className="bg-slate-50/50 border-y border-slate-200 text-slate-600 select-none">
                                        <th className="py-2.5 px-3 font-extrabold w-14 text-center">번호</th>
                                        <th className="py-2.5 px-3 font-extrabold">제목/내용</th>
                                        <th className="py-2.5 px-3 font-extrabold w-28 text-center">제/개정일</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {attachmentList.length === 0 ? (
                                        <tr>
                                          <td colSpan={3} className="py-8 text-center text-slate-400 font-bold bg-white">
                                            검색 결과가 없습니다.
                                          </td>
                                        </tr>
                                      ) : (
                                        attachmentList.map((att: any, idx: number) => {
                                          const isHwp = att.fileType?.toLowerCase() === "hwp";
                                          const isPdf = att.fileType?.toLowerCase() === "pdf";
                                          let typeBg = "bg-slate-100 text-slate-600 border border-slate-200";
                                          if (isHwp) typeBg = "bg-rose-50 text-rose-700 border border-rose-100";
                                          if (isPdf) typeBg = "bg-red-50 text-red-700 border border-red-100";

                                          return (
                                            <tr
                                              key={att.id}
                                              className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                                            >
                                              <td className="py-2.5 px-3 text-center text-slate-400 font-bold align-middle">{idx + 1}</td>
                                              <td className="py-2.5 px-3 font-extrabold text-slate-800 flex items-center justify-between gap-4">
                                                <a
                                                  href={att.fileUrl}
                                                  download
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="flex items-center gap-2 hover:text-blue-700 cursor-pointer min-w-0"
                                                >
                                                  <span className={`w-7 h-7 rounded shrink-0 flex items-center justify-center font-black text-[9px] uppercase ${typeBg}`}>
                                                    {att.fileType || "FIL"}
                                                  </span>
                                                  <span className="truncate" title={att.title}>{att.title}</span>
                                                  <span className="text-slate-400 font-bold text-[10px] shrink-0">({att.ruleTitle})</span>
                                                </a>
                                                <button
                                                  type="button"
                                                  onClick={() => setActiveRuleId(att.ruleId)}
                                                  className="border border-[#009b9e] text-[#009b9e] hover:bg-[#009b9e] hover:text-white text-[9px] font-black px-2.5 py-0.5 rounded cursor-pointer transition-all active:scale-95 shrink-0 select-none shadow-sm"
                                                >
                                                  규정 보기
                                                </button>
                                              </td>
                                              <td className="py-2.5 px-3 text-center text-slate-500 font-bold align-middle">
                                                {att.enactmentDate ? new Date(att.enactmentDate).toLocaleDateString() : "-"}
                                              </td>
                                            </tr>
                                          );
                                        })
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </>
                  )}
                 </div>
            </div>
            </>
          ) : (
            
            /* CASE B: 대형 중앙 검색창이 있는 메인 대시보드 레이아웃 */
            <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar">
              <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 min-h-[750px]">
                
                {/* [파트 1] 왼쪽 대형 검색 폼 (상단: 폼, 하단: 건물사진) */}
                <div className="bg-gradient-to-b from-[#0c3161] via-[#092244] to-[#04101e] rounded-2xl text-left text-white shadow-xl relative overflow-hidden flex flex-col">
                  
                  {/* 하단 학교 배경이미지 */}
                  <div className="absolute left-0 right-0 bottom-0 top-1/2 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#092244] to-transparent z-10" />
                    <Image
                      src="/yewon.jpg"
                      alt="예원예술대학교 전경"
                      fill
                      priority
                      className="object-cover object-bottom opacity-60 mix-blend-luminosity"
                    />
                  </div>

                  {/* 배경 패턴 그래픽 데코레이션 */}
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] z-1 pointer-events-none"></div>
                  
                  <div className="relative z-10 w-full p-8 md:p-10 flex-shrink-0 flex flex-col items-start">
                    
                    {/* 타이틀 */}
                    <div className="flex items-center justify-start mb-4 select-none">
                      <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center">
                        <span className="text-[#fbf2d5] font-black">예원예술대학교</span>
                        <span className="text-white/20 font-light mx-2.5 text-2xl md:text-3xl select-none">|</span>
                        <span>규정관리시스템</span>
                      </h2>
                    </div>

                    {/* NSU 스타일 고급 상세 검색 폼 (배경을 투명화하여 뒷배경의 학교 전경이 보임) */}
                    <div className="w-full text-left text-sm text-slate-200 space-y-4 bg-[#071e3d]/25 backdrop-blur-lg p-6 rounded-2xl border border-white/5 shadow-2xl">
                      
                      {/* 1. 검색영역 */}
                      <div className="grid grid-cols-1 sm:grid-cols-[100px_1fr] items-center gap-2 sm:gap-4">
                        <label className="font-extrabold text-white flex items-center gap-1.5 text-[13px] sm:text-[15px]">
                          <span className="text-blue-400">•</span> 검색영역
                        </label>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-slate-200 hover:text-white text-[13px] sm:text-[14.5px]">
                            <input
                              type="radio"
                              name="scope"
                              checked={scope === "current"}
                              onChange={() => setScope("current")}
                              className="w-4 h-4 text-blue-600 bg-white/10 border-slate-300 focus:ring-blue-500 cursor-pointer"
                            />
                            현행
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-slate-200 hover:text-white text-[13px] sm:text-[14.5px]">
                            <input
                              type="radio"
                              name="scope"
                              checked={scope === "history"}
                              onChange={() => setScope("history")}
                              className="w-4 h-4 text-blue-600 bg-white/10 border-slate-300 focus:ring-blue-500 cursor-pointer"
                            />
                            연혁
                          </label>
                        </div>
                      </div>

                      {/* 2. 검색옵션 */}
                      <div className="grid grid-cols-1 sm:grid-cols-[100px_1fr] items-center gap-2 sm:gap-4">
                        <label className="font-extrabold text-white flex items-center gap-1.5 text-[13px] sm:text-[15px]">
                          <span className="text-blue-400">•</span> 검색옵션
                        </label>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                          <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-slate-200 hover:text-white text-[13px] sm:text-[14.5px]">
                            <input
                              type="checkbox"
                              checked={optionAll}
                              onChange={(e) => handleToggleAll(e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded bg-white/10 border-slate-300 focus:ring-blue-500 cursor-pointer"
                            />
                            전체
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-slate-200 hover:text-white text-[13px] sm:text-[14.5px]">
                            <input
                              type="checkbox"
                              checked={optionTitle}
                              onChange={(e) => handleToggleOption("title", e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded bg-white/10 border-slate-300 focus:ring-blue-500 cursor-pointer"
                            />
                            제목
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-slate-200 hover:text-white text-[13px] sm:text-[14.5px]">
                            <input
                              type="checkbox"
                              checked={optionBody}
                              onChange={(e) => handleToggleOption("body", e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded bg-white/10 border-slate-300 focus:ring-blue-500 cursor-pointer"
                            />
                            본문
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-slate-200 hover:text-white text-[13px] sm:text-[14.5px]">
                            <input
                              type="checkbox"
                              checked={optionAttachment}
                              onChange={(e) => handleToggleOption("attachment", e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded bg-white/10 border-slate-300 focus:ring-blue-500 cursor-pointer"
                            />
                            서식
                          </label>
                        </div>
                      </div>

                      {/* 3. 개정기간 */}
                      <div className="grid grid-cols-1 sm:grid-cols-[100px_1fr] items-center gap-2 sm:gap-4">
                        <label className="font-extrabold text-white flex items-center gap-1.5 text-[13px] sm:text-[15px]">
                          <span className="text-blue-400">•</span> 개정기간
                        </label>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <input
                            type="date"
                            value={enactmentStart}
                            onChange={(e) => setEnactmentStart(e.target.value)}
                            className="bg-white text-slate-800 rounded px-2.5 py-1 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-black text-sm h-[32px] w-[145px]"
                          />
                          <span className="text-white select-none">~</span>
                          <input
                            type="date"
                            value={enactmentEnd}
                            onChange={(e) => setEnactmentEnd(e.target.value)}
                            className="bg-white text-slate-800 rounded px-2.5 py-1 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-black text-sm h-[32px] w-[145px]"
                          />
                          <div className="flex items-center gap-1 ml-1">
                            <button
                              type="button"
                              onClick={() => handleQuickDate("1w")}
                              className="bg-[#142c4b]/80 hover:bg-[#1a385f] text-blue-300 hover:text-white font-extrabold text-xs px-2.5 py-1.5 rounded transition-all cursor-pointer select-none active:scale-95 border border-white/5"
                            >
                              1주
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickDate("1m")}
                              className="bg-[#142c4b]/80 hover:bg-[#1a385f] text-blue-300 hover:text-white font-extrabold text-xs px-2.5 py-1.5 rounded transition-all cursor-pointer select-none active:scale-95 border border-white/5"
                            >
                              1달
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickDate("1y")}
                              className="bg-[#142c4b]/80 hover:bg-[#1a385f] text-blue-300 hover:text-white font-extrabold text-xs px-2.5 py-1.5 rounded transition-all cursor-pointer select-none active:scale-95 border border-white/5"
                            >
                              1년
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 4. 검색어 */}
                      <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-[100px_1fr] items-center gap-2 sm:gap-4 pt-1">
                        <label className="font-extrabold text-white flex items-center gap-1.5 text-[13px] sm:text-[15px]">
                          <span className="text-blue-400">•</span> 검색어
                        </label>
                        <div className="flex w-full items-center">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="규정명, 본문 내용, 공포번호, 서식명 등을 입력하세요..."
                            className="flex-1 bg-white text-slate-800 rounded-l-lg px-4 py-2 border-y border-l border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-extrabold text-sm sm:text-base h-11"
                          />
                          <button
                            type="submit"
                            className="bg-amber-500 hover:bg-amber-600 text-white font-black text-sm sm:text-base px-6 h-11 rounded-r-lg border-y border-r border-amber-500 transition-all cursor-pointer active:scale-95"
                          >
                            검색
                          </button>
                        </div>
                      </form>

                      {/* 하단 가나다검색 & 개정일검색 링크 */}
                      <div className="flex justify-end gap-4 text-xs sm:text-sm font-bold text-blue-300 pt-1 border-t border-white/5 mt-2">
                        <button
                          onClick={() => handleTagClick("학칙")}
                          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer select-none"
                        >
                          🔤 가나다검색
                        </button>
                        <span className="text-white/20">|</span>
                        <button
                          onClick={() => handleQuickDate("1m")}
                          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer select-none"
                        >
                          📅 개정일검색
                        </button>
                      </div>

                    </div>
                  </div>
                </div>

                {/* [파트 2] 오른쪽 영역: 최근 제·개정 규정 및 최근 공지사항 수직 배치 */}
                <div className="flex flex-col gap-6">
                  
                  {/* 2-1) 최근 제·개정 규정 게시판 */}
                  <Paper className="p-6 border border-slate-200 rounded-2xl shadow-sm flex flex-col flex-1 min-h-[350px]" elevation={0}>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4 shrink-0">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <GavelIcon className="text-blue-800" />
                        최근 제·개정 규정
                      </h3>
                      <span className="text-xs text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                        실시간 반영
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar">
                      {loadingRecent ? (
                        <div className="flex justify-center items-center h-full">
                          <CircularProgress size={30} />
                        </div>
                      ) : recentRules.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 text-sm">
                          최근 등록된 제·개정 규정이 없습니다.
                        </div>
                      ) : (
                        recentRules.map((rule) => {
                          const isAbolished = rule.status === "ABOLISHED";
                          return (
                            <div
                              key={rule.id}
                              onClick={() => setActiveRuleId(rule.id)}
                              className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50/80 cursor-pointer transition-colors group"
                            >
                              <div className="min-w-0 flex-1 pr-4">
                                <h4 className={`text-sm font-bold text-slate-800 truncate group-hover:text-blue-900 transition-colors ${isAbolished ? "line-through text-slate-400" : ""}`}>
                                  {rule.title}
                                </h4>
                                <p className="text-[11px] text-slate-400 mt-1">
                                  {rule.ruleNumber} | {rule.categoryName} | {rule.departmentName}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-xs font-semibold text-blue-700 block">
                                  {rule.latestVersionName}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  {rule.enactmentDate ? new Date(rule.enactmentDate).toLocaleDateString() : "-"}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </Paper>

                  {/* 2-2) 최근 공지사항 게시판 */}
                  <Paper className="p-6 border border-slate-200 rounded-2xl shadow-sm flex flex-col flex-1 min-h-[350px]" elevation={0}>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4 shrink-0">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <CampaignIcon className="text-amber-500" />
                        최근 공지사항
                      </h3>
                      <IconButton size="small" onClick={() => window.location.reload()}>
                        <RefreshIcon className="text-slate-400 text-sm" />
                      </IconButton>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar">
                      {loadingNotices ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                          <CircularProgress size={20} sx={{ color: "#0c3161" }} />
                          <span className="text-slate-400 text-[10px] font-bold">공지사항 인입 중...</span>
                        </div>
                      ) : notices.length === 0 ? (
                        <div className="text-center py-24 text-slate-400 text-xs font-bold">
                          등록된 공지사항이 아직 없습니다.
                        </div>
                      ) : (
                        notices.map((notice: any) => (
                          <div
                            key={notice.id}
                            onClick={() => {
                              setSelectedNotice(notice);
                              setNoticeModalOpen(true);
                            }}
                            className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-[#0c3161]/5 cursor-pointer transition-all active:scale-98 group"
                          >
                            <div className="min-w-0 flex-1 pr-4 text-left">
                              <h4 className="text-sm font-bold text-slate-700 truncate group-hover:text-blue-900 transition-colors">
                                {notice.title}
                              </h4>
                              <p className="text-[11px] text-slate-400 mt-1">
                                작성부서: {notice.dept}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs text-slate-400 font-medium">
                                {notice.date}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Paper>

                </div>
                
                {/* [파트 3] 풋터 영역 */}
                <footer className="text-center text-sm font-medium text-slate-500 py-6 border-t border-slate-200 mt-12">
                  <p>Copyright &copy; 2026 예원예술대학교. All Rights Reserved.</p>
                </footer>

              </div>
            </div>
          )}
        </main>

      </div>

      {/* 실시간 공지사항 상세 보기 모달 다이얼로그 (Tailwind CSS 글래스모피즘 테마) */}
      {noticeModalOpen && selectedNotice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden max-h-[85vh] hover:scale-[1.005] transition-all">
            
            {/* 모달 헤더 */}
            <div className="bg-gradient-to-r from-[#0c3161] to-[#092244] p-5 text-white flex flex-col gap-1.5 select-none">
              <span className="text-[10px] font-black text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded border border-amber-300/30 w-fit">
                공지사항 ({selectedNotice.dept})
              </span>
              <h3 className="text-base font-black leading-snug">
                {selectedNotice.title}
              </h3>
            </div>

            {/* 메타 정보 */}
            <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-bold select-none">
              <span>작성 부서: {selectedNotice.dept}</span>
              <span>작성일: {selectedNotice.date}</span>
            </div>

            {/* 모달 본문 */}
            <div className="p-6 overflow-y-auto flex-1 text-slate-700 text-xs leading-relaxed whitespace-pre-wrap font-medium">
              {selectedNotice.content}
            </div>

            {/* 모달 푸터 버튼 */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setNoticeModalOpen(false);
                  setSelectedNotice(null);
                }}
                className="bg-[#0c3161] hover:bg-[#092244] text-white text-xs font-black px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                닫기
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
