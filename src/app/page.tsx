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
import ArticleIcon from "@mui/icons-material/Article";
import SidebarTree from "@/components/SidebarTree";
import RuleViewer from "@/components/RuleViewer";
import Link from "next/link";
import FallingLeaves from "@/components/FallingLeaves";

const HalftoneCircle = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="dotPattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
        <circle cx="5" cy="5" r="3.2" fill="currentColor" />
      </pattern>
      <radialGradient id="dotFade" cx="50%" cy="50%" r="50%">
        <stop offset="30%" stopColor="white" stopOpacity="1" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </radialGradient>
      <mask id="dotMask">
        <circle cx="100" cy="100" r="100" fill="url(#dotFade)" />
      </mask>
    </defs>
    <rect x="0" y="0" width="200" height="200" fill="url(#dotPattern)" mask="url(#dotMask)" />
  </svg>
);

export default function Home() {
  const [activeRuleId, setActiveRuleId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  
  // 카테고리 뷰 관련 상태
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [activeNoticeId, setActiveNoticeId] = useState<string | null>(null);
  const [activeVerticalTab, setActiveVerticalTab] = useState<string>("규정");
  const [activeCategoryName, setActiveCategoryName] = useState<string | null>(null);
  const [categoryRules, setCategoryRules] = useState<any[]>([]);
  const [loadingCategory, setLoadingCategory] = useState(false);
  
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

  // 관리자 인증 상태 및 세션 타이머
  const [isAdmin, setIsAdmin] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(1800);

  // 메인 화면 인트로 애니메이션 상태
  const [showIntro, setShowIntro] = useState(true);
  const [animateOut, setAnimateOut] = useState(false);

  const handleEnterSystem = () => {
    setAnimateOut(true);
    setTimeout(() => {
      setShowIntro(false);
    }, 1200);
  };

  useEffect(() => {
    let timerId: NodeJS.Timeout;

    const checkSession = () => {
      const sessionTime = localStorage.getItem("yewon_admin_session");
      if (sessionTime && sessionTime !== "authorized") {
        const time = parseInt(sessionTime, 10);
        const elapsed = Math.floor((Date.now() - time) / 1000);
        const remaining = 1800 - elapsed;
        if (remaining > 0) {
          setIsAdmin(true);
          setSessionTimeLeft(remaining);
        } else {
          // 세션 만료
          localStorage.removeItem("yewon_admin_session");
          setIsAdmin(false);
          window.location.reload();
        }
      } else if (sessionTime === "authorized") {
        localStorage.setItem("yewon_admin_session", Date.now().toString());
        setIsAdmin(true);
        setSessionTimeLeft(1800);
      } else {
        setIsAdmin(false);
      }
    };

    checkSession();
    timerId = setInterval(checkSession, 1000);

    return () => clearInterval(timerId);
  }, []);

  const handleAdminLogout = () => {
    localStorage.removeItem("yewon_admin_session");
    setIsAdmin(false);
    window.location.reload();
  };

  const handleExtendSession = () => {
    localStorage.setItem("yewon_admin_session", Date.now().toString());
    setSessionTimeLeft(1800);
  };

  // 공지사항 로드 함수
  const loadNotices = async () => {
    setLoadingNotices(true);
    try {
      const res = await fetch("/api/notices");
      const data = (await res.json()) as any;
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
        const data = (await res.json()) as any;
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
      const data = (await res.json()) as any;
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
    setActiveCategoryId(null);
    setActiveCategoryName(null);
    setCategoryRules([]);
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
    setActiveNoticeId(null);
  };

  // 인기 태그 바로 검색 기능
  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    handleSearch(undefined, tag);
  };

  const handleCategorySelect = async (categoryId: string, categoryName: string) => {
    setActiveRuleId(null);
    setIsSearching(false);
    setActiveCategoryId(categoryId);
    setActiveCategoryName(categoryName);
    setActiveNoticeId(null);
    setLoadingCategory(true);
    try {
      let url = `/api/rules/search?query=`;
      if (categoryId.startsWith("abc-")) {
        url += `&initialSound=${encodeURIComponent(categoryId.replace("abc-", ""))}`;
      } else if (categoryId.startsWith("dept-")) {
        url += `&departmentId=${encodeURIComponent(categoryId.replace("dept-", ""))}`;
      } else {
        url += `&categoryId=${encodeURIComponent(categoryId)}`;
      }
      const res = await fetch(url);
      const data = (await res.json()) as any;
      if (Array.isArray(data)) {
        setCategoryRules(data);
      } else {
        setCategoryRules([]);
      }
    } catch(e) {
      console.error(e);
      setCategoryRules([]);
    } finally {
      setLoadingCategory(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-slate-50 relative font-sans text-slate-800">
      
      {/* ==================== 0. 인트로 애니메이션 오버레이 (Curtain Effect) ==================== */}
      {showIntro && (
        <div className={`fixed inset-0 z-[100] flex transition-opacity duration-1000 ease-in-out ${animateOut ? 'opacity-0 delay-300 pointer-events-none' : 'opacity-100'}`}>
          {/* 바탕 (우측 영역 배경 역할): 아주 옅은 남색 계열 배경과 은은한 도트 패턴 */}
          <div className="absolute inset-0 overflow-hidden bg-[#f2f5f9]">
            {/* 도트 패턴 오버레이 (옅은 남색 톤) */}
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(12, 49, 97, 0.1) 1.5px, transparent 1.5px)', backgroundSize: '18px 18px' }} />
          </div>

          {/* 좌측: 전경 이미지 (세련된 사선 컷팅 디자인 - clip-path 사용) */}
          <div 
            className={`absolute left-0 top-0 h-full w-full lg:w-[65%] bg-[#0c3161] overflow-hidden transition-transform duration-1000 ease-in-out z-20 ${animateOut ? '-translate-x-full' : 'translate-x-0'}`}
            style={{ clipPath: 'polygon(0 0, 80% 0, 100% 100%, 0 100%)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c3161]/90 via-[#0c3161]/40 to-transparent z-10" />
            <div className="absolute inset-0 bg-black/20 z-10" /> {/* 텍스트 가독성을 위한 약간의 어두운 오버레이 */}

            {/* 떨어지는 나뭇잎 애니메이션 연출 */}
            <FallingLeaves />

            <Image 
              src="/yewon2.jpeg" 
              alt="예원예술대학교 전경" 
              fill 
              priority 
              className="object-cover opacity-90 z-0"
            />
            
            {/* 연두색 은은한 삼각형 (이미지 경계와 겹치도록 좌측 영역 내부에 배치) 약간 더 밝게 */}
            <div 
              className="absolute inset-0 bg-[#2ee6d6]/50 backdrop-blur-[1px] mix-blend-multiply z-10 pointer-events-none hidden lg:block"
              style={{ clipPath: 'polygon(30% 0, 100% 0, 100% 100%)' }}
            />

            {/* 하단 좌측 원래 텍스트 복구 (한 줄 배치) */}
            <div className="absolute bottom-16 left-12 z-20 text-white select-none flex items-center gap-3 lg:gap-4">
              <h2 className="text-3xl lg:text-4xl font-black drop-shadow-2xl tracking-tight">
                <span className="text-[#93c5fd]">Y</span>ewon <span className="text-[#fde047]">A</span>rts <span className="text-[#ef4444]">U</span>niversity
              </h2>
              <span className="text-2xl text-white/50 mb-1">|</span>
              <p className="text-xl lg:text-2xl font-bold text-blue-100 drop-shadow-md">규정관리시스템</p>
            </div>

            {/* 모바일용 입장 버튼 */}
            <div className="lg:hidden absolute bottom-40 left-12 z-30">
              <button 
                onClick={handleEnterSystem} 
                className="pointer-events-auto bg-white/20 backdrop-blur-md border border-white/30 text-white px-6 py-3 rounded-xl font-black text-[14px] shadow-xl hover:bg-white/30 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                시스템 입장하기 <ArrowForwardIosIcon sx={{fontSize:14}} />
              </button>
            </div>
          </div>
          
          {/* 우측: 타이틀 및 프리미엄 입장 버튼 */}
          <div className={`absolute right-0 top-0 h-full hidden lg:flex w-[45%] xl:w-[45%] flex-col justify-center items-center pb-16 z-10 transition-transform duration-1000 ease-in-out ${animateOut ? 'translate-x-full' : 'translate-x-0'}`}>
            
            {/* 우측 상단 배치 로고 */}
            <div className="absolute top-10 right-8 xl:right-12">
              <Image
                src="/UI.png"
                alt="예원예술대학교 로고"
                width={200}
                height={45}
                className="object-contain w-[180px] xl:w-[220px]"
              />
            </div>

            {/* 중앙 홍보 문구 (우측 흰색 부분으로 이동) */}
            <div className="flex flex-col items-center justify-center z-20 text-[#0c3161] select-none px-6 xl:px-12 text-center w-full">
              <h1 className="text-5xl xl:text-6xl 2xl:text-7xl font-black italic tracking-widest text-teal-500 drop-shadow-sm mb-4 xl:mb-6">
                YES, WE CAN!
              </h1>
              <h2 className="text-2xl xl:text-3xl 2xl:text-4xl font-extrabold tracking-tight mb-8 xl:mb-10 text-slate-800">
                꿈을 현실로 우리는 예원인 예원예술대학교
              </h2>
              <div className="flex flex-col items-center gap-2">
                <p className="text-lg xl:text-xl 2xl:text-2xl font-bold text-slate-700">
                  잠재된 젊음의 패기, 도전의 꿈
                </p>
                <p className="text-sm xl:text-base 2xl:text-lg font-medium text-slate-600 mt-1">
                  문화예술 인재 양성의 요람인 예원예술대학교에서 마음껏 펼쳐보십시오
                </p>
              </div>
            </div>
            
            {/* 우측 하단 배너 버튼 (첨부 이미지 스타일) */}
            <div className="absolute bottom-0 right-0 w-[55vw] lg:w-[50vw] xl:w-[45vw] h-[80px] lg:h-[90px] flex justify-end z-30">
              <button 
                onClick={handleEnterSystem}
                className="pointer-events-auto group relative w-full h-full flex items-center justify-between overflow-hidden cursor-pointer"
              >
                {/* 좌측 다크 블루 배너 영역 */}
                <div 
                  className="absolute inset-0 right-[130px] lg:right-[150px] bg-[#0f172a] group-hover:bg-[#1e293b] transition-colors flex items-center justify-end pr-8 lg:pr-12"
                  style={{ clipPath: 'polygon(40px 0, calc(100% - 25px) 0, 100% 50%, calc(100% - 25px) 100%, 0 100%)' }}
                >
                  <span className="text-[19px] lg:text-[22px] font-medium text-white tracking-wider relative z-10 mr-4">
                    규정관리시스템 입장하기
                  </span>
                </div>
                
                {/* 우측 화살표 애니메이션 영역 (배경은 투명하여 뒷배경의 흰색이 보이게 함) */}
                <div className="absolute right-0 top-0 bottom-0 w-[110px] lg:w-[130px] flex items-center">
                  <div className="relative w-full h-full flex items-center">
                    <div className="absolute top-0 bottom-0 left-[0px] w-[40px] lg:w-[45px] bg-[#1e3a8a] animate-arrow-seq delay-150" style={{ clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%, 15px 50%)' }}></div>
                    <div className="absolute top-0 bottom-0 left-[25px] lg:left-[30px] w-[40px] lg:w-[45px] bg-[#3b82f6] animate-arrow-seq delay-300" style={{ clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%, 15px 50%)' }}></div>
                    <div className="absolute top-0 bottom-0 left-[50px] lg:left-[60px] w-[40px] lg:w-[45px] bg-[#bfdbfe] animate-arrow-seq delay-450" style={{ clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%, 15px 50%)' }}></div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

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
          <span className="text-xs text-slate-400 font-bold tracking-wider hidden md:inline-block pt-1 ml-1">
            Yewon Arts University Rule Management
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

          <span className="text-slate-300 font-bold select-none text-sm">|</span>

          {/* 관리자 로그인 버튼 추가 */}
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 mr-1">
                <span className="text-sm font-bold text-[#0c3161] select-none">
                  관리자님 안녕하세요!
                </span>
                <div className="flex items-center bg-slate-100 rounded-full px-2 py-0.5 border border-slate-200 shadow-inner">
                  <span className="text-[11px] font-black text-rose-600 mr-1.5 font-mono w-[34px] text-center">
                    {Math.floor(sessionTimeLeft / 60)}:{String(sessionTimeLeft % 60).padStart(2, "0")}
                  </span>
                  <button
                    onClick={handleExtendSession}
                    className="text-[10px] font-bold bg-white text-slate-600 border border-slate-300 rounded px-1.5 py-0.5 hover:bg-slate-50 hover:text-blue-700 transition-colors cursor-pointer active:scale-95"
                    title="세션 시간 30분으로 연장"
                  >
                    연장
                  </button>
                </div>
              </div>
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
                  px: 1.5,
                  py: 0.5,
                  minHeight: "32px",
                }}
                className="font-bold text-xs active:scale-95 transition-all text-white font-sans"
              >
                관리자 페이지
              </Button>
              <Button
                onClick={handleAdminLogout}
                variant="outlined"
                sx={{
                  borderColor: "#cbd5e1",
                  color: "#64748b",
                  "&:hover": { borderColor: "#94a3b8", bgcolor: "#f1f5f9" },
                  borderRadius: "8px",
                  fontWeight: "bold",
                  fontSize: "0.775rem",
                  px: 1.5,
                  py: 0.5,
                  minHeight: "32px",
                }}
                className="font-bold text-xs active:scale-95 transition-all font-sans"
              >
                로그아웃
              </Button>
            </div>
          ) : (
            <Button
              component={Link}
              href="/admin"
              variant="text"
              className="font-bold text-sm text-slate-700 hover:text-blue-900 active:scale-95 transition-all font-sans"
            >
              관리자 로그인
            </Button>
          )}
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
                setActiveCategoryId(null);
                setActiveVerticalTab("규정"); // 규정 선택 시 자동으로 규정 탭으로 이동
                setActiveNoticeId(null);
              }}
              onSelectCategory={(categoryId, categoryName) => {
                handleCategorySelect(categoryId, categoryName);
                setActiveNoticeId(null);
              }}
              onTabChange={(tab) => {
                setActiveVerticalTab(tab);
                if (tab === "조직도" || tab === "공지사항") {
                  setActiveRuleId(null);
                  setActiveCategoryId(null);
                  setIsSearching(false);
                  if (tab === "조직도") setActiveNoticeId(null);
                }
              }}
              onSelectNotice={(noticeId) => {
                setActiveNoticeId(noticeId);
                setActiveVerticalTab("공지사항");
                setActiveRuleId(null);
                setActiveCategoryId(null);
                setIsSearching(false);
              }}
            />
          </div>
        </aside>

        {/* 우측 메인 영역 */}
        <main className="flex-1 h-full overflow-hidden bg-slate-100 flex flex-col relative pl-6">
          
          {/* 사이드바 접기/펴기 고급 세로 결합식 핸들 버튼 (프리미엄 윈도우 UI - 남색 테마 스크롤 따라다니는 중앙 배치) */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 z-30 transition-all duration-300 ease-in-out hidden lg:block"
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
          {activeVerticalTab === "조직도" ? (
            <div className="flex-1 overflow-y-auto bg-white flex flex-col h-full relative">
              {/* 상단 고정 헤더 */}
              <div className="bg-[#0c3161] p-4 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-md">
                <h2 className="text-white font-extrabold text-lg lg:text-xl">예원예술대학교 기구표 (조직도)</h2>
                <a href="/docs/1.jpg" download="예원예술대학교_기구표.jpg" className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-bold transition-colors">
                  다운로드
                </a>
              </div>
              
              {/* 이미지 영역 (여백 없이 꽉 차게) */}
              <div className="w-full bg-white flex justify-center overflow-x-auto p-4">
                <img 
                  src="/docs/1.jpg" 
                  alt="조직도" 
                  className="min-w-[1000px] w-full h-auto object-contain block mx-auto" 
                />
              </div>
            </div>
          ) : activeVerticalTab === "공지사항" ? (
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50 scrollbar">
              <div className="max-w-6xl mx-auto">
                <div className="flex flex-col gap-4">
                  <div className="flex items-end justify-between border-b-[3px] border-[#1e3a8a] pb-4 select-none">
                    <h2 className="text-[28px] font-black text-slate-900 tracking-tight flex items-center gap-2">
                      공지사항
                    </h2>
                    <span className="text-[14px] text-slate-600 font-bold tracking-wider">
                      HOME &gt; 공지사항
                    </span>
                  </div>

                  {activeNoticeId ? (() => {
                    const notice = notices.find((n: any) => n.id === activeNoticeId);
                    if (!notice) return null;
                    return (
                      <div className="bg-white border-t-2 border-slate-700 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                        <div className="px-8 py-6 border-b border-slate-200">
                          <h3 className="text-[22px] font-black text-slate-900 tracking-tight mb-2">
                            {notice.title}
                          </h3>
                          <div className="flex items-center gap-6 text-[14px] font-bold text-slate-500 mt-2">
                            <span>작성부서: <span className="text-slate-700">{notice.dept}</span></span>
                            <span>작성일: <span className="text-slate-700">{notice.date}</span></span>
                          </div>
                        </div>
                        <div className="p-8 text-[15px] text-slate-800 leading-relaxed font-medium whitespace-pre-wrap flex-1">
                          {notice.content}
                        </div>
                        <div className="px-8 py-5 border-t border-slate-200 bg-slate-50 flex justify-end">
                          <button
                            onClick={() => setActiveNoticeId(null)}
                            className="bg-white border border-slate-300 text-slate-700 font-bold px-6 py-2 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer active:scale-95 text-[14px]"
                          >
                            목록
                          </button>
                        </div>
                      </div>
                    );
                  })() : (
                    <>
                      <div className="flex items-center text-[15px] font-extrabold text-slate-700 select-none mb-3 mt-1">
                        <span className="mr-3">전체: <span className="text-blue-700">{notices.length}</span>건</span>
                        <span>페이지: 1/1</span>
                      </div>

                      <div className="bg-white border-t-2 border-slate-700 shadow-sm overflow-hidden">
                        {loadingNotices ? (
                          <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <CircularProgress size={30} sx={{ color: "#0c3161" }} />
                            <span className="text-slate-500 text-xs font-semibold">공지사항 로드 중...</span>
                          </div>
                        ) : (
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b-2 border-slate-200 text-slate-800 text-[16px] select-none">
                                <th className="py-4 px-4 font-black w-24 text-center border-r border-slate-200">번호</th>
                                <th className="py-4 px-4 font-black text-center">제목</th>
                                <th className="py-4 px-4 font-black w-40 text-center border-l border-slate-200">작성부서</th>
                                <th className="py-4 px-4 font-black w-40 text-center border-l border-slate-200">작성일</th>
                              </tr>
                            </thead>
                            <tbody>
                              {notices.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-20 text-center text-slate-400 text-[15px] font-bold">
                                    등록된 공지사항이 없습니다.
                                  </td>
                                </tr>
                              ) : (
                                notices.map((notice, idx) => (
                                  <tr key={notice.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                                    <td className="py-4 px-4 text-center text-slate-500 font-extrabold text-[16px]">
                                      {notices.length - idx}
                                    </td>
                                    <td className="py-4 px-4">
                                      <button
                                        type="button"
                                        onClick={() => setActiveNoticeId(notice.id)}
                                        className="text-slate-800 font-medium hover:text-blue-800 cursor-pointer text-[15.5px] transition-colors text-left"
                                      >
                                        {notice.title}
                                      </button>
                                    </td>
                                    <td className="py-4 px-4 text-center text-slate-600 font-medium text-[15px]">
                                      {notice.dept}
                                    </td>
                                    <td className="py-4 px-4 text-center text-slate-600 font-medium text-[15px]">
                                      {notice.date}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        )}
                        {!loadingNotices && notices.length > 0 && (
                          <div className="flex items-center justify-center py-6 border-t border-slate-200 bg-white">
                            <div className="flex gap-1.5">
                              <button className="px-4 py-1.5 bg-[#0c3161] text-white text-[15px] font-black shadow-sm">1</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : activeRuleId ? (
            /* 규정 뷰어 표시 */
            <div className="flex-1 overflow-hidden h-full bg-white shadow-[-4px_0_15px_rgba(0,0,0,0.03)] border-l border-slate-200">
              <RuleViewer ruleId={activeRuleId} isAdmin={isAdmin} />
            </div>
          ) : activeCategoryId ? (
            /* 카테고리(분야/부서/폴더) 뷰 표시 */
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50 scrollbar">
              <div className="max-w-6xl mx-auto">
                <div className="flex flex-col gap-4">
                  {/* 카테고리 뷰 헤더 타이틀 */}
                  <div className="flex items-end justify-between border-b-[3px] border-[#1e3a8a] pb-4 select-none">
                    <h2 className="text-[28px] font-black text-slate-900 tracking-tight flex items-center gap-2">
                      {activeCategoryName}
                    </h2>
                    <span className="text-[14px] text-slate-600 font-bold tracking-wider">
                      HOME &gt; 전자규정집 &gt; {activeCategoryName}
                    </span>
                  </div>

                  {/* 건수 및 페이지 표시 */}
                  <div className="flex items-center text-[15px] font-extrabold text-slate-700 select-none mb-3 mt-1">
                    <span className="mr-3">전체: <span className="text-blue-700">{categoryRules.length}</span>건</span>
                    <span>페이지: 1/1</span>
                  </div>

                  {/* 규정 목록 테이블 */}
                  <div className="bg-white border-t-2 border-slate-700 shadow-sm overflow-hidden">
                    {loadingCategory ? (
                      <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <CircularProgress size={30} sx={{ color: "#0c3161" }} />
                        <span className="text-slate-500 text-xs font-semibold">규정 목록 로드 중...</span>
                      </div>
                    ) : (
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b-2 border-slate-200 text-slate-800 text-[16px] select-none">
                            <th className="py-4 px-4 font-black w-20 text-center border-r border-slate-200">번호</th>
                            <th className="py-4 px-4 font-black text-center">제목</th>
                            <th className="py-4 px-4 font-black w-32 text-center">제·개정일 ▽</th>
                            <th className="py-4 px-4 font-black w-28 text-center">다운로드</th>
                            <th className="py-4 px-4 font-black w-28 text-center">전체보기</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoryRules.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-20 text-center text-slate-400 text-[15px] font-bold">
                                등록된 규정이 없습니다.
                              </td>
                            </tr>
                          ) : (
                            categoryRules.map((rule, idx) => (
                              <tr key={rule.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                                <td className="py-4 px-4 text-center text-slate-500 font-extrabold text-[16px]">{idx + 1}</td>
                                <td className="py-4 px-4">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveRuleId(rule.id);
                                      setActiveCategoryId(null);
                                    }}
                                    className="text-slate-800 font-medium hover:text-blue-800 cursor-pointer text-[15.5px] transition-colors"
                                  >
                                    {rule.title}
                                  </button>
                                </td>
                                <td className="py-4 px-4 text-center text-slate-600 font-medium text-[15px]">
                                  {rule.enactmentDate ? new Date(rule.enactmentDate).toLocaleDateString() : "-"}
                                </td>
                                <td className="py-4 px-4 text-center">
                                  <span className="text-[15px] text-slate-400 font-medium">-</span>
                                </td>
                                <td className="py-4 px-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveRuleId(rule.id);
                                      setActiveCategoryId(null);
                                    }}
                                    className="text-[14px] font-medium text-slate-500 hover:text-blue-700 hover:underline cursor-pointer"
                                  >
                                    전체보기
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}
                    
                    {/* 페이징 하단 바 (장식) */}
                    {!loadingCategory && categoryRules.length > 0 && (
                      <div className="flex items-center justify-center py-6 border-t border-slate-200 bg-white">
                        <div className="flex gap-1.5">
                          <button className="px-3 py-1.5 border border-slate-200 bg-slate-50 text-slate-500 font-bold text-[14px] cursor-pointer hover:bg-slate-100 transition-colors">«</button>
                          <button className="px-3 py-1.5 border border-slate-200 bg-slate-50 text-slate-500 font-bold text-[14px] cursor-pointer hover:bg-slate-100 transition-colors">&lt;</button>
                          <button className="px-4 py-1.5 bg-[#0c3161] text-white text-[15px] font-black shadow-sm">1</button>
                          <button className="px-3 py-1.5 border border-slate-200 bg-slate-50 text-slate-500 font-bold text-[14px] cursor-pointer hover:bg-slate-100 transition-colors">&gt;</button>
                          <button className="px-3 py-1.5 border border-slate-200 bg-slate-50 text-slate-500 font-bold text-[14px] cursor-pointer hover:bg-slate-100 transition-colors">»</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
                      className="bg-[#009b9e] hover:bg-[#008082] text-white text-xs font-black px-4 h-[28px] rounded-r cursor-pointer active:scale-95 transition-all shrink-0 whitespace-nowrap"
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
                                                  href={att.fileUrl.startsWith('http') ? `${att.fileUrl}?download=${encodeURIComponent(att.title + '.hwp')}` : att.fileUrl}
                                                  download={att.fileUrl.startsWith('http') ? undefined : true}
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
            <div className="flex-1 flex flex-col overflow-y-auto scrollbar bg-slate-50 relative">
              <div className="max-w-[1400px] w-full mx-auto p-6 md:p-8 flex flex-col gap-8 min-h-0">
                
                {/* [파트 1] 상단 검색 배너 (전면 중앙 - 부드러운 배경색 및 우측 이미지) */}
                <div className="bg-[#009b9e] rounded-2xl text-left text-white shadow-xl relative overflow-hidden flex flex-col shrink-0 min-h-[260px] justify-center">
                  
                  {/* 우측 끝 학교 배경 (규정목록 헤더와 동일한 블렌딩) */}
                  <div 
                    className="absolute inset-y-0 right-0 w-[50%] z-0 pointer-events-none"
                    style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 60%)', maskImage: 'linear-gradient(to right, transparent 0%, black 60%)' }}
                  >
                    <Image
                      src="/yewon2.jpeg"
                      alt="예원예술대학교 전경"
                      fill
                      className="object-cover object-[center_30%] opacity-50 mix-blend-multiply"
                    />
                  </div>

                  {/* 배경 패턴 그래픽 데코레이션 (흰 도트 유지) */}
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] z-1 pointer-events-none"></div>
                  
                  {/* 검색란을 왼쪽으로 줄여서 우측 배경이 잘 보이도록 조정 */}
                  <div className="relative z-10 w-full lg:w-[85%] xl:w-[75%] p-8 md:px-12 md:py-10 flex flex-col justify-center">
                    
                    {/* 타이틀 (크기 및 간격 조정) */}
                    <div className="flex items-center justify-start mb-8 lg:mb-10 select-none">
                      <h2 className="text-[28px] lg:text-[34px] font-black text-white/95 tracking-wide drop-shadow-md">
                        예원예술대학교 규정관리시스템
                      </h2>
                    </div>

                    <div className="flex flex-col 2xl:flex-row items-start 2xl:items-center gap-6 2xl:gap-8 w-full">
                      {/* 검색 폼 영역 (배경보다 연하게 - 화이트 투명도 사용) */}
                      <div className="flex-1 flex flex-col w-full bg-white/15 backdrop-blur-md p-5 xl:p-6 rounded-2xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] gap-3 xl:gap-4">
                        
                        <div className="font-black text-xl xl:text-2xl tracking-wider text-white/90 drop-shadow-sm">SEARCH</div>

                        <div className="flex-1 w-full flex flex-col gap-3 xl:gap-4">
                          {/* 1열: 검색영역 & 검색옵션 */}
                          <div className="flex flex-col xl:flex-row items-start xl:items-center gap-3 xl:gap-8">
                            {/* 검색영역 */}
                            <div className="flex items-center gap-3">
                              <label className="font-extrabold text-white/80 text-[13px] lg:text-[14px] w-[60px] shrink-0">검색영역</label>
                              <div className="flex items-center gap-4">
                                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-white text-[13px] lg:text-[14px] whitespace-nowrap">
                                  <input type="radio" name="scope" checked={scope === "current"} onChange={() => setScope("current")} className="w-4 h-4 cursor-pointer accent-white" />
                                  현행
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-white text-[13px] lg:text-[14px] whitespace-nowrap">
                                  <input type="radio" name="scope" checked={scope === "history"} onChange={() => setScope("history")} className="w-4 h-4 cursor-pointer accent-white" />
                                  연혁
                                </label>
                              </div>
                            </div>
                            
                            {/* 검색옵션 */}
                            <div className="flex items-center gap-3 flex-wrap mt-2 xl:mt-0">
                              <label className="font-extrabold text-white/80 text-[13px] lg:text-[14px] w-[60px] xl:w-auto shrink-0">검색옵션</label>
                              <div className="flex items-center gap-3 lg:gap-4 flex-wrap">
                                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-white text-[13px] lg:text-[14px] whitespace-nowrap">
                                  <input type="checkbox" checked={optionAll} onChange={(e) => handleToggleAll(e.target.checked)} className="w-4 h-4 rounded cursor-pointer accent-white" />
                                  전체
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-white text-[13px] lg:text-[14px] whitespace-nowrap">
                                  <input type="checkbox" checked={optionTitle} onChange={(e) => handleToggleOption("title", e.target.checked)} className="w-4 h-4 rounded cursor-pointer accent-white" />
                                  제목
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-white text-[13px] lg:text-[14px] whitespace-nowrap">
                                  <input type="checkbox" checked={optionBody} onChange={(e) => handleToggleOption("body", e.target.checked)} className="w-4 h-4 rounded cursor-pointer accent-white" />
                                  본문
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-white text-[13px] lg:text-[14px] whitespace-nowrap">
                                  <input type="checkbox" checked={optionAttachment} onChange={(e) => handleToggleOption("attachment", e.target.checked)} className="w-4 h-4 rounded cursor-pointer accent-white" />
                                  별표/별지
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* 2열: 개정기간 */}
                          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                            <label className="font-extrabold text-white/80 text-[13px] lg:text-[14px] w-[60px] shrink-0">개정기간</label>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="flex items-center gap-2">
                                <input type="date" value={enactmentStart} onChange={(e) => setEnactmentStart(e.target.value)} className="bg-white text-slate-800 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-400 font-bold text-xs lg:text-sm h-8 w-[120px] lg:w-[130px]" />
                                <span className="text-white/70">-</span>
                                <input type="date" value={enactmentEnd} onChange={(e) => setEnactmentEnd(e.target.value)} className="bg-white text-slate-800 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-400 font-bold text-xs lg:text-sm h-8 w-[120px] lg:w-[130px]" />
                              </div>
                              <div className="flex items-center gap-1 mt-1 md:mt-0 ml-0 md:ml-2">
                                <button type="button" onClick={() => handleQuickDate("1w")} className="bg-white text-[#009b9e] font-bold text-xs px-2.5 py-1.5 rounded-sm hover:bg-slate-100 transition-colors shadow-sm whitespace-nowrap">1주</button>
                                <button type="button" onClick={() => handleQuickDate("1m")} className="bg-white text-[#009b9e] font-bold text-xs px-2.5 py-1.5 rounded-sm hover:bg-slate-100 transition-colors shadow-sm whitespace-nowrap">1달</button>
                                <button type="button" onClick={() => handleQuickDate("1y")} className="bg-white text-[#009b9e] font-bold text-xs px-2.5 py-1.5 rounded-sm hover:bg-slate-100 transition-colors shadow-sm whitespace-nowrap">1년</button>
                              </div>
                            </div>
                          </div>

                          {/* 3열: 검색어 */}
                          <form onSubmit={handleSearch} className="flex items-center gap-3 w-full mt-1">
                            <label className="font-extrabold text-white/80 text-[13px] lg:text-[14px] w-[60px] shrink-0">검색어</label>
                            <div className="flex flex-1 items-center shadow-md">
                              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-white text-slate-800 rounded-l px-3 lg:px-4 py-2 focus:outline-none font-bold text-sm h-9 lg:h-10 w-full" />
                              <button type="submit" className="bg-[#fbcc14] hover:bg-[#eab308] text-slate-800 font-black text-[14px] lg:text-[15px] px-6 lg:px-8 h-9 lg:h-10 rounded-r transition-colors whitespace-nowrap">검색</button>
                            </div>
                          </form>
                        </div>
                      </div>

                      {/* 오른쪽 퀵 버튼 영역 삭제됨 */}
                    </div>

                  </div>
                </div>

                {/* [파트 2] 하단 2단 게시판 영역 */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-[400px]">
                  
                  {/* 2-1) 규정 공지 게시판 (왼쪽) */}
                  <Paper className="border border-slate-200 rounded-xl shadow-sm flex flex-col flex-1 min-h-[300px] overflow-hidden" elevation={0}>
                    <div className="px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-200 bg-slate-100">
                      <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#fdf5e6] flex items-center justify-center border border-[#ffe0b2]">
                           <CampaignIcon className="text-orange-500" fontSize="small" />
                        </div>
                        규정 공지
                      </h3>
                      <IconButton size="small" onClick={() => window.location.reload()} sx={{ bgcolor: "#f1f5f9", "&:hover": { bgcolor: "#e2e8f0" } }}>
                        <span className="text-slate-400 font-bold text-lg leading-none w-5 h-5 flex items-center justify-center">+</span>
                      </IconButton>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 bg-white scrollbar">
                      {loadingNotices ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                          <CircularProgress size={20} sx={{ color: "#0c3161" }} />
                        </div>
                      ) : notices.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 text-sm font-bold">등록된 공지사항이 아직 없습니다.</div>
                      ) : (
                        <ul className="flex flex-col">
                          {notices.map((notice: any) => (
                            <li key={notice.id} className="group">
                              <div onClick={() => { setSelectedNotice(notice); setNoticeModalOpen(true); }} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors">
                                <span className={`shrink-0 px-2 py-0.5 rounded text-[11.5px] font-extrabold ${notice.title.includes("개정") ? "bg-[#81c784] text-white" : "bg-[#ffd54f] text-slate-800"}`}>
                                  {notice.title.includes("개정") ? "개정알림" : "의견수렴"}
                                </span>
                                <span className="flex-1 text-[14.5px] font-bold text-slate-700 truncate group-hover:text-blue-700 transition-colors">
                                  [{notice.title.includes("개정") ? "규정개정" : "의견수렴"}] {notice.title}
                                </span>
                                <span className="shrink-0 text-[13px] text-slate-500 font-bold font-mono">
                                  {notice.date.replace(/-/g, '.')}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </Paper>

                  {/* 2-2) 최신 제·개정 규정 게시판 (오른쪽) */}
                  <Paper className="border border-slate-200 rounded-xl shadow-sm flex flex-col flex-1 min-h-[300px] overflow-hidden" elevation={0}>
                    <div className="px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-200 bg-slate-100">
                      <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#e3f2fd] flex items-center justify-center border border-[#bbdefb]">
                           <ArticleIcon className="text-blue-600" fontSize="small" />
                        </div>
                        최신 제·개정
                      </h3>
                      <IconButton size="small" onClick={() => window.location.reload()} sx={{ bgcolor: "#f1f5f9", "&:hover": { bgcolor: "#e2e8f0" } }}>
                        <span className="text-slate-400 font-bold text-lg leading-none w-5 h-5 flex items-center justify-center">+</span>
                      </IconButton>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 bg-white scrollbar">
                      {loadingRecent ? (
                        <div className="flex justify-center items-center h-full">
                          <CircularProgress size={20} />
                        </div>
                      ) : recentRules.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 text-sm font-bold">최근 등록된 제·개정 규정이 없습니다.</div>
                      ) : (
                        <ul className="flex flex-col">
                          {recentRules.map((rule) => {
                            const isAbolished = rule.status === "ABOLISHED";
                            return (
                              <li key={rule.id} className="group">
                                <div onClick={() => setActiveRuleId(rule.id)} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors">
                                  <span className={`shrink-0 px-2 py-0.5 rounded text-[11.5px] font-extrabold ${isAbolished ? "bg-red-400 text-white" : "bg-[#81c784] text-white"}`}>
                                    {rule.latestVersionName}
                                  </span>
                                  <span className={`flex-1 text-[14.5px] font-bold text-slate-700 truncate group-hover:text-blue-700 transition-colors ${isAbolished ? "line-through text-slate-400" : ""}`}>
                                    {rule.title}
                                  </span>
                                  <span className="shrink-0 text-[13px] text-slate-500 font-bold font-mono">
                                    {rule.enactmentDate ? new Date(rule.enactmentDate).toLocaleDateString().replace(/\. /g, '.').replace(/\.$/, '') : "-"}
                                  </span>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </Paper>

                </div>

              </div>
            </div>
          )}
        </main>

      </div>

      {/* ==================== 3. 공통 풋터 영역 ==================== */}
      <footer className="bg-[#2c2c2c] text-[#aaaaaa] py-4 px-8 shrink-0 w-full z-50 flex items-center justify-center border-t border-[#444] shadow-[0_-4px_10px_rgba(0,0,0,0.2)]">
        <div className="flex flex-col xl:flex-row items-center xl:items-end gap-6 max-w-[1600px] w-full">
          {/* 좌측 로고 영역 */}
          <div className="shrink-0 flex items-center justify-center">
            <Image
              src="/UI_white.png"
              alt="예원예술대학교 로고"
              width={183}
              height={40}
              className="h-8 w-auto object-contain opacity-80"
            />
          </div>
          
          {/* 우측 주소 및 카피라이트 텍스트 영역 (가로형) */}
          <div className="flex flex-wrap items-center justify-center xl:justify-start gap-x-4 gap-y-1.5 text-[12.5px] leading-snug tracking-tight text-center xl:text-left flex-1 pb-0.5">
            <p>
              <span className="font-bold text-[#ccc]">경기드림캠퍼스</span> 11429 경기도 양주시 은현면 예원대학로 56 <span className="text-[#888] ml-1">(TEL: 031-869-0526 / FAX: 031-859-8114)</span>
            </p>
            <div className="hidden xl:block w-[1px] h-3 bg-[#555]"></div>
            <p>
              <span className="font-bold text-[#ccc]">전북희망캠퍼스</span> 55913 전북특별자치도 임실군 신평면 창인로 117 <span className="text-[#888] ml-1">(TEL: 063-640-7114 / FAX: 063-640-7773)</span>
            </p>
            <div className="hidden xl:block w-[1px] h-3 bg-[#555]"></div>
            <p className="text-[#777] font-medium w-full xl:w-auto mt-1 xl:mt-0">
              Copyright &copy; 2014-2026. YEWON ARTS UNIVERSITY. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>

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
