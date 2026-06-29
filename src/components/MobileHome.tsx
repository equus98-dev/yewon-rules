"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { CircularProgress, Dialog } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LockIcon from "@mui/icons-material/Lock";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import CloseIcon from "@mui/icons-material/Close";
import RuleViewer from "@/components/RuleViewer";
import SidebarTree from "@/components/SidebarTree";
import SnailLoader from "@/components/SnailLoader";

export default function MobileHome() {
  const [activeRuleId, setActiveRuleId] = useState<string | null>(null);
  const [activeNoticeId, setActiveNoticeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("activeCategoryId")) {
      return "category";
    }
    return "main";
  }); // 'main', 'category', 'notice', 'search'
  
  // 카테고리 선택 상태
  const [selectedCategoryTitle, setSelectedCategoryTitle] = useState<string>("");
  const [categoryRules, setCategoryRules] = useState<any[]>([]);
  const [loadingCategory, setLoadingCategory] = useState<boolean>(false);

  // 검색 상태
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);

  // 모바일 햄버거 슬라이드 메뉴 상태
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  // 대시보드용 최신 제개정 목록 및 공지사항
  const [recentRules, setRecentRules] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);

  // 북마크(자주 찾는 규정) 모달 상태
  const [bookmarkOpen, setBookmarkOpen] = useState<boolean>(false);

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [rulesRes, noticesRes] = await Promise.all([
          fetch("/api/rules/search?query="),
          fetch("/api/notices")
        ]);
        const rulesData = await rulesRes.json() as any;
        const noticesData = await noticesRes.json() as any;

        if (Array.isArray(rulesData)) {
          const sorted = rulesData.sort(
            (a: any, b: any) => new Date(b.enactmentDate).getTime() - new Date(a.enactmentDate).getTime()
          );
          setRecentRules(sorted.slice(0, 5));
        }
        if (Array.isArray(noticesData)) {
          setNotices(noticesData);
        }

        if (typeof window !== "undefined") {
          const savedRuleId = sessionStorage.getItem("activeRuleId");
          const savedCategoryId = sessionStorage.getItem("activeCategoryId");
          const savedCategoryName = sessionStorage.getItem("activeCategoryName") || "카테고리 규정";
          
          if (savedRuleId) {
            setActiveRuleId(savedRuleId);
          } else if (savedCategoryId) {
            setActiveTab("category");
            setSelectedCategoryTitle(savedCategoryName);
            setLoadingCategory(true);
            
            let url = `/api/rules/search?query=`;
            if (savedCategoryId.startsWith("abc-")) {
              url += `&initialSound=${encodeURIComponent(savedCategoryId.replace("abc-", ""))}`;
            } else if (savedCategoryId.startsWith("dept-")) {
              url += `&departmentId=${encodeURIComponent(savedCategoryId.replace("dept-", ""))}`;
            } else {
              url += `&categoryId=${encodeURIComponent(savedCategoryId)}`;
            }
            const catRes = await fetch(url);
            const catData = await catRes.json() as any;
            if (Array.isArray(catData)) {
              setCategoryRules(catData);
            } else {
              setCategoryRules([]);
            }
            setLoadingCategory(false);
          }
        }
      } catch (error) {
        console.error("Failed to load initial mobile data:", error);
      } finally {
        setLoadingInitial(false);
      }
    }
    fetchInitialData();
  }, []);

  // 퀵 카테고리 클릭 핸들러
  const handleQuickCategory = async (type: string, title: string) => {
    setActiveRuleId(null);
    setActiveNoticeId(null);
    setSelectedCategoryTitle(title);
    setActiveTab("category");
    setLoadingCategory(true);
    try {
      let url = `/api/rules/search?query=`;
      if (type === "dept") {
        url = `/api/rules/search?query=운영`; // 교무/기획/운영 등 주요 소관부서 관련 규정 로드
      } else if (type === "form") {
        url = `/api/rules/search?query=별지`;
      } else if (type === "recent") {
        url = `/api/rules/search?query=`;
      } else if (type.startsWith("virtual-")) {
        const keyword = type.replace("virtual-", "");
        url = `/api/rules/search?query=${encodeURIComponent(keyword)}`;
      } else {
        url = `/api/rules/search?query=&categoryId=${encodeURIComponent(type)}`;
      }
      const res = await fetch(url);
      const data = await res.json() as any;
      
      let rulesList: any[] = [];
      if (Array.isArray(data)) {
        rulesList = data;
      } else if (data && data.isGrouped) {
        const combined = [...(data.titleMatches || []), ...(data.bodyMatches || [])];
        const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
        rulesList = unique;
      }

      if (type === "recent") {
        const sorted = rulesList.sort((a: any, b: any) => new Date(b.enactmentDate).getTime() - new Date(a.enactmentDate).getTime());
        setCategoryRules(sorted.slice(0, 20));
      } else {
        setCategoryRules(rulesList);
      }
    } catch (error) {
      console.error(error);
      setCategoryRules([]);
    } finally {
      setLoadingCategory(false);
    }
  };

  // 모바일 검색 핸들러
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoadingSearch(true);
    try {
      const res = await fetch(`/api/rules/search?query=${encodeURIComponent(searchQuery)}&scope=current&options=all`);
      const data = await res.json() as any;
      
      let rulesList: any[] = [];
      if (Array.isArray(data)) {
        rulesList = data;
      } else if (data && data.isGrouped) {
        const combined = [...(data.titleMatches || []), ...(data.bodyMatches || [])];
        const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
        rulesList = unique;
      }
      
      setSearchResults(rulesList);
      setActiveTab("search");
      setSearchModalOpen(false);
      setActiveRuleId(null);
      setActiveNoticeId(null);
    } catch (error) {
      console.error(error);
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa] font-sans text-slate-800 select-none pb-16">
      {/* 1. 상단 스마트 헤더 */}
      <header className="bg-white h-14 border-b border-slate-200 px-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setDrawerOpen(true)}
            className="p-1 text-slate-700 hover:bg-slate-100 rounded-full transition-colors active:scale-95"
            aria-label="메뉴 열기"
          >
            <MenuIcon sx={{ fontSize: 26 }} />
          </button>

          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => { setActiveTab("main"); setActiveRuleId(null); setActiveNoticeId(null); }}>
            <Image src="/UI.png" alt="로고" width={100} height={22} className="object-contain h-5 w-auto" />
            <span className="text-blue-900 font-black text-[15px] tracking-tight border-l border-slate-300 pl-1.5">
              규정관리시스템
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => setSearchModalOpen(true)} 
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-full transition-colors active:scale-95"
            aria-label="검색창 열기"
          >
            <SearchIcon sx={{ fontSize: 24 }} />
          </button>
          <Link href="/admin" className="p-2 text-slate-700 hover:bg-slate-100 rounded-full transition-colors active:scale-95">
            <LockIcon sx={{ fontSize: 20 }} />
          </Link>
        </div>
      </header>

      {/* ==================== 본문 동적 라우팅 뷰 ==================== */}
      <main className="flex-1 w-full flex flex-col">
        {loadingInitial ? (
          <SnailLoader message="규정 데이터를 가져오는 중..." />
        ) : activeRuleId ? (
          /* 풀스크린 모바일 규정 뷰어 */
          <div className="flex-1 bg-white flex flex-col w-full min-h-screen">
            <div className="bg-[#0c3161] text-white px-4 py-3.5 flex items-center justify-between sticky top-14 z-30 shadow-md">
              <button 
                onClick={() => setActiveRuleId(null)} 
                className="flex items-center gap-1.5 text-white font-bold text-[15px] active:scale-95 transition-all py-1 px-2 bg-white/10 rounded-lg border border-white/20"
              >
                <ArrowBackIosNewIcon sx={{ fontSize: 16 }} /> 뒤로가기
              </button>
              <span className="text-sm font-extrabold tracking-wider truncate max-w-[200px]">규정 본문 열람</span>
              <div className="w-8"></div>
            </div>
            <div className="flex-1 px-4 py-6 overflow-y-auto scrollbar">
              <RuleViewer ruleId={activeRuleId} />
            </div>
          </div>
        ) : activeNoticeId ? (
          /* 모바일 공지사항 상세 뷰 */
          <div className="flex-1 bg-white flex flex-col w-full min-h-screen">
            <div className="bg-[#1d4ed8] text-white px-4 py-3.5 flex items-center justify-between sticky top-14 z-30 shadow-md">
              <button 
                onClick={() => setActiveNoticeId(null)} 
                className="flex items-center gap-1.5 text-white font-bold text-[15px] active:scale-95 transition-all py-1 px-2 bg-white/10 rounded-lg border border-white/20"
              >
                <ArrowBackIosNewIcon sx={{ fontSize: 16 }} /> 목록으로
              </button>
              <span className="text-sm font-extrabold tracking-wider truncate max-w-[200px]">공지사항 상세</span>
              <div className="w-8"></div>
            </div>
            {(() => {
              const notice = notices.find((n: any) => n.id === activeNoticeId);
              if (!notice) return <div className="p-10 text-center">공지사항을 찾을 수 없습니다.</div>;
              return (
                <div className="flex flex-col flex-1">
                  <div className="px-6 py-5 border-b border-slate-300 bg-slate-100">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">
                      {notice.title}
                    </h3>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                      <span>작성부서: <span className="text-slate-700">{notice.dept}</span></span>
                      <span>작성일: <span className="text-slate-700">{notice.date}</span></span>
                    </div>
                  </div>
                  <div className="p-6 text-[15px] text-slate-800 leading-relaxed font-medium whitespace-pre-wrap flex-1">
                    {notice.content}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : activeTab === "main" ? (
          /* 2. 모바일 메인 대시보드 */
          <div className="w-full flex flex-col">
            {/* 비주얼 히어로 배너 (첨부 이미지 영감) */}
            <div className="bg-gradient-to-br from-[#0c3161] via-[#11407a] to-[#1e3a8a] text-white px-6 py-11 flex flex-col items-center justify-center relative overflow-hidden shadow-inner text-center">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-400/20 via-transparent to-transparent pointer-events-none"></div>
              
              <h1 className="text-4xl font-black italic text-[#00d896] tracking-wider mb-2 drop-shadow-md">
                YES, WE CAN!
              </h1>
              <h2 className="text-[20px] font-extrabold tracking-tight text-white mb-6 drop-shadow">
                꿈을 현실로 우리는 예원인 예원예술대학교
              </h2>
              
              <div className="flex flex-col items-center gap-1.5 w-full border-t border-white/10 pt-5 mb-6">
                <p className="text-[15px] font-bold text-teal-100 tracking-wide">
                  잠재된 젊음의 패기, 도전의 꿈
                </p>
                <p className="text-[12px] font-medium text-slate-200 tracking-wide opacity-95">
                  문화예술 인재 양성의 요람인 예원예술대학교에서 마음껏 펼쳐보십시오
                </p>
              </div>

              <div className="w-full max-w-md bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex items-center justify-between cursor-pointer shadow-lg active:scale-95 transition-all" onClick={() => setSearchModalOpen(true)}>
                <span className="text-white/90 text-sm font-bold pl-2">규정명 또는 키워드를 검색하세요...</span>
                <div className="w-8 h-8 bg-white text-[#0c3161] rounded-xl flex items-center justify-center font-bold shadow-md">
                  <SearchIcon sx={{ fontSize: 18 }} />
                </div>
              </div>
            </div>

            {/* 3. 원형 퀵버튼 카테고리 (Round Touch Icons) */}
            <div className="bg-white py-8 px-4 border-b border-slate-200 shadow-sm">
              <div className="grid grid-cols-4 gap-y-6 gap-x-2 max-w-md mx-auto">
                {[
                  { title: "학교법인", icon: "🏫", color: "from-amber-500 to-orange-500", id: "virtual-학교법인" },
                  { title: "대학헌장", icon: "📖", color: "from-emerald-500 to-teal-600", id: "virtual-대학헌장" },
                  { title: "대학운영", icon: "⚖️", color: "from-blue-600 to-indigo-700", id: "virtual-대학운영" },
                  { title: "최신규정", icon: "⚡", color: "from-violet-600 to-purple-700", type: "recent" },
                  { title: "소관부서", icon: "🏛️", color: "from-rose-500 to-red-600", type: "dept" },
                  { title: "각종서식", icon: "📝", color: "from-cyan-500 to-blue-600", type: "form" },
                  { title: "공지사항", icon: "📣", color: "from-fuchsia-600 to-pink-600", tab: "notice" },
                  { title: "자주찾는", icon: "⭐", color: "from-yellow-400 to-amber-500", action: "bookmark" },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (item.action === "bookmark") {
                        setBookmarkOpen(true);
                      } else if (item.tab === "notice") {
                        setActiveTab("notice");
                      } else if (item.type) {
                        handleQuickCategory(item.type, item.title);
                      } else if (item.id) {
                        handleQuickCategory(item.id, item.title);
                      }
                    }}
                    className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition-all"
                  >
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-tr ${item.color} text-white flex items-center justify-center text-2xl shadow-md group-hover:shadow-lg transition-all border border-white/40`}>
                      {item.icon}
                    </div>
                    <span className="text-[13px] font-extrabold text-slate-700 tracking-tight">
                      {item.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. 모바일 카드 그리드: 최신 제·개정 규정 */}
            <div className="p-4 py-6 w-full max-w-lg mx-auto">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-[17px] font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0c3161]"></span> 최신 제·개정 규정
                </h3>
                <button 
                  onClick={() => handleQuickCategory("recent", "최신 제·개정 규정")} 
                  className="text-xs font-extrabold text-blue-700 hover:underline flex items-center gap-0.5"
                >
                  더보기 <ArrowForwardIosIcon sx={{ fontSize: 10 }} />
                </button>
              </div>

              {loadingInitial ? (
                <div className="py-12 flex justify-center"><CircularProgress size={28} /></div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {recentRules.map((rule) => (
                    <div 
                      key={rule.id}
                      onClick={() => setActiveRuleId(rule.id)}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-blue-500 transition-all cursor-pointer active:scale-98 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[11px] font-extrabold">
                          {rule.ruleNumber || "규정"}
                        </span>
                        <span className="text-[12px] font-bold text-slate-400">
                          {rule.enactmentDate ? rule.enactmentDate.split("T")[0] : ""}
                        </span>
                      </div>
                      <h4 className="text-[15px] font-extrabold text-slate-800 tracking-tight line-clamp-1">
                        {rule.title}
                      </h4>
                      <p className="text-[13px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                        {rule.summary || rule.contentText || "제·개정 세부 조문 내용을 터치하여 열람하세요."}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* 실시간 공지사항 카드 섹션 */}
              <div className="flex items-center justify-between mb-4 mt-8 px-1">
                <h3 className="text-[17px] font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1d4ed8]"></span> 실시간 공지사항
                </h3>
                <button 
                  onClick={() => setActiveTab("notice")} 
                  className="text-xs font-extrabold text-blue-700 hover:underline flex items-center gap-0.5"
                >
                  더보기 <ArrowForwardIosIcon sx={{ fontSize: 10 }} />
                </button>
              </div>

              {loadingInitial ? (
                <div className="py-12 flex justify-center"><CircularProgress size={28} /></div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {notices.slice(0, 3).map((notice) => (
                    <div 
                      key={notice.id}
                      onClick={() => setActiveNoticeId(notice.id)}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-blue-500 transition-all cursor-pointer active:scale-98 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[11px] font-extrabold">
                          {notice.dept}
                        </span>
                        <span className="text-[12px] font-bold text-slate-400">
                          {notice.date}
                        </span>
                      </div>
                      <h4 className="text-[15px] font-extrabold text-slate-800 tracking-tight line-clamp-1">
                        {notice.title}
                      </h4>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === "category" ? (
          /* 카테고리별 규정 목록 뷰 */
          <div className="w-full flex flex-col min-h-screen bg-slate-50">
            <div className="bg-[#0c3161] text-white px-4 py-3.5 flex items-center justify-between sticky top-14 z-30 shadow-md">
              <button 
                onClick={() => setActiveTab("main")} 
                className="flex items-center gap-1.5 text-white font-bold text-[15px] active:scale-95 transition-all py-1 px-2 bg-white/10 rounded-lg border border-white/20"
              >
                <ArrowBackIosNewIcon sx={{ fontSize: 16 }} /> 메인으로
              </button>
              <span className="text-sm font-extrabold tracking-wider truncate max-w-[200px]">{selectedCategoryTitle}</span>
              <div className="w-8"></div>
            </div>
            <div className="p-4 w-full max-w-lg mx-auto flex flex-col gap-2.5">
              <div className="text-xs font-bold text-slate-500 mb-1 px-1">
                전체 <span className="text-blue-700 font-extrabold">{categoryRules.length}</span>건의 규정이 조회되었습니다.
              </div>
              {loadingCategory ? (
                <div className="py-20 flex justify-center"><CircularProgress size={30} /></div>
              ) : categoryRules.length === 0 ? (
                <div className="py-20 text-center text-slate-400 font-bold text-sm">해당 카테고리에 등록된 규정이 없습니다.</div>
              ) : (
                categoryRules.map((rule) => (
                  <div 
                    key={rule.id}
                    onClick={() => setActiveRuleId(rule.id)}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-blue-500 transition-all cursor-pointer active:scale-98 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[11px] font-extrabold">
                        {rule.ruleNumber || "규정"}
                      </span>
                      <span className="text-[12px] font-bold text-slate-400">
                        {rule.enactmentDate ? rule.enactmentDate.split("T")[0] : ""}
                      </span>
                    </div>
                    <h4 className="text-[15px] font-extrabold text-slate-800 tracking-tight line-clamp-1">
                      {rule.title}
                    </h4>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : activeTab === "notice" ? (
          /* 공지사항 전체 목록 뷰 */
          <div className="w-full flex flex-col min-h-screen bg-slate-50">
            <div className="bg-[#1d4ed8] text-white px-4 py-3.5 flex items-center justify-between sticky top-14 z-30 shadow-md">
              <button 
                onClick={() => setActiveTab("main")} 
                className="flex items-center gap-1.5 text-white font-bold text-[15px] active:scale-95 transition-all py-1 px-2 bg-white/10 rounded-lg border border-white/20"
              >
                <ArrowBackIosNewIcon sx={{ fontSize: 16 }} /> 메인으로
              </button>
              <span className="text-sm font-extrabold tracking-wider truncate max-w-[200px]">공지사항 전체</span>
              <div className="w-8"></div>
            </div>
            <div className="p-4 w-full max-w-lg mx-auto flex flex-col gap-2.5">
              <div className="text-xs font-bold text-slate-500 mb-1 px-1">
                전체 <span className="text-blue-700 font-extrabold">{notices.length}</span>건의 공지사항이 조회되었습니다.
              </div>
              {loadingInitial ? (
                <div className="py-20 flex justify-center"><CircularProgress size={30} /></div>
              ) : notices.length === 0 ? (
                <div className="py-20 text-center text-slate-400 font-bold text-sm">등록된 공지사항이 없습니다.</div>
              ) : (
                notices.map((notice) => (
                  <div 
                    key={notice.id}
                    onClick={() => setActiveNoticeId(notice.id)}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-blue-500 transition-all cursor-pointer active:scale-98 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[11px] font-extrabold">
                        {notice.dept}
                      </span>
                      <span className="text-[12px] font-bold text-slate-400">
                        {notice.date}
                      </span>
                    </div>
                    <h4 className="text-[15px] font-extrabold text-slate-800 tracking-tight line-clamp-1">
                      {notice.title}
                    </h4>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* 검색 결과 뷰 */
          <div className="w-full flex flex-col min-h-screen bg-slate-50">
            <div className="bg-[#0c3161] text-white px-4 py-3.5 flex items-center justify-between sticky top-14 z-30 shadow-md">
              <button 
                onClick={() => setActiveTab("main")} 
                className="flex items-center gap-1.5 text-white font-bold text-[15px] active:scale-95 transition-all py-1 px-2 bg-white/10 rounded-lg border border-white/20"
              >
                <ArrowBackIosNewIcon sx={{ fontSize: 16 }} /> 메인으로
              </button>
              <span className="text-sm font-extrabold tracking-wider truncate max-w-[200px]">검색 결과</span>
              <div className="w-8"></div>
            </div>
            <div className="p-4 w-full max-w-lg mx-auto flex flex-col gap-2.5">
              <div className="text-xs font-bold text-slate-500 mb-1 px-1">
                &apos;{searchQuery}&apos; 검색결과 <span className="text-blue-700 font-extrabold">{searchResults.length}</span>건
              </div>
              {searchResults.length === 0 ? (
                <div className="py-20 text-center text-slate-400 font-bold text-sm">검색 결과가 없습니다.</div>
              ) : (
                searchResults.map((rule) => (
                  <div 
                    key={rule.id}
                    onClick={() => setActiveRuleId(rule.id)}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-blue-500 transition-all cursor-pointer active:scale-98 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[11px] font-extrabold">
                        {rule.ruleNumber || "규정"}
                      </span>
                      <span className="text-[12px] font-bold text-slate-400">
                        {rule.enactmentDate ? rule.enactmentDate.split("T")[0] : ""}
                      </span>
                    </div>
                    <h4 className="text-[15px] font-extrabold text-slate-800 tracking-tight line-clamp-1">
                      {rule.title}
                    </h4>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* ==================== 5. 하단 고정 바 (Bottom Navigation Bar) ==================== */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 px-6 flex items-center justify-between z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] max-w-lg mx-auto">
        <button 
          onClick={() => {
            if (activeRuleId) setActiveRuleId(null);
            else if (activeNoticeId) setActiveNoticeId(null);
            else if (activeTab !== "main") setActiveTab("main");
            else window.history.back();
          }} 
          className="flex flex-col items-center gap-1 text-slate-600 hover:text-[#0c3161] active:scale-95 transition-all cursor-pointer"
        >
          <ArrowBackIosNewIcon sx={{ fontSize: 20 }} />
          <span className="text-[11px] font-extrabold">뒤로</span>
        </button>

        <button 
          onClick={() => window.history.forward()} 
          className="flex flex-col items-center gap-1 text-slate-600 hover:text-[#0c3161] active:scale-95 transition-all cursor-pointer"
        >
          <ArrowForwardIosIcon sx={{ fontSize: 20 }} />
          <span className="text-[11px] font-extrabold">앞으로</span>
        </button>

        <button 
          onClick={() => { setActiveTab("main"); setActiveRuleId(null); setActiveNoticeId(null); }} 
          className="flex flex-col items-center gap-1 text-[#0c3161] active:scale-95 transition-all cursor-pointer"
        >
          <HomeIcon sx={{ fontSize: 24 }} />
          <span className="text-[11px] font-black">홈</span>
        </button>

        <button 
          onClick={() => setBookmarkOpen(true)} 
          className="flex flex-col items-center gap-1 text-slate-600 hover:text-[#0c3161] active:scale-95 transition-all cursor-pointer"
        >
          <BookmarkBorderIcon sx={{ fontSize: 22 }} />
          <span className="text-[11px] font-extrabold">북마크</span>
        </button>
      </nav>

      {/* ==================== 모달: 검색창 ==================== */}
      <Dialog open={searchModalOpen} onClose={() => setSearchModalOpen(false)} fullWidth maxWidth="sm">
        <div className="bg-white p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">모바일 규정 검색</h3>
            <button onClick={() => setSearchModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
              <CloseIcon />
            </button>
          </div>
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2.5">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="검색어를 입력하세요..."
              className="w-full bg-slate-100 border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0c3161]"
              autoFocus
            />
            <button type="submit" className="w-full bg-[#0c3161] text-white py-3 rounded-xl font-bold text-sm shadow active:scale-95 transition-all">
              검색
            </button>
          </form>
          <div className="flex flex-col gap-2 mt-2">
            <span className="text-xs font-bold text-slate-500">인기 검색어</span>
            <div className="flex flex-wrap gap-2">
              {["정관", "학칙", "장학금", "교원인사", "등록금", "별지"].map((tag, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => { setSearchQuery(tag); }}
                  className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-all active:scale-95"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Dialog>

      {/* ==================== 모달: 북마크 (자주 찾는 규정) ==================== */}
      <Dialog open={bookmarkOpen} onClose={() => setBookmarkOpen(false)} fullWidth maxWidth="sm">
        <div className="bg-white p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <span className="text-amber-500">⭐</span> 자주 찾는 규정 (북마크)
            </h3>
            <button onClick={() => setBookmarkOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
              <CloseIcon />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { id: "1-0-1", title: "학교법인 예원예술대학교 정관" },
              { id: "2-0-1", title: "예원예술대학교 대학헌장" },
              { id: "3-1-1", title: "예원예술대학교 학칙" },
              { id: "3-1-2", title: "학칙시행세칙" },
              { id: "3-5-4", title: "교원연봉제 운영규정" },
              { id: "3-5-5", title: "직원연봉제 운영규정" },
            ].map((bm) => (
              <button
                key={bm.id}
                onClick={() => {
                  setActiveRuleId(bm.id);
                  setBookmarkOpen(false);
                }}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left font-extrabold text-sm text-slate-800 hover:border-amber-500 transition-all active:scale-98 flex items-center justify-between"
              >
                <span>{bm.title}</span>
                <span className="text-xs text-amber-600 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">{bm.id}</span>
              </button>
            ))}
          </div>
        </div>
      </Dialog>

      {/* ==================== 모달: 햄버거 슬라이드 메뉴 ==================== */}
      <Dialog open={drawerOpen} onClose={() => setDrawerOpen(false)} fullScreen>
        <div className="flex flex-col h-screen bg-white">
          <div className="bg-[#0c3161] text-white p-4 flex items-center justify-between shrink-0 shadow-md">
            <span className="font-extrabold text-base tracking-wide">전체 규정 목차 (메뉴)</span>
            <button onClick={() => setDrawerOpen(false)} className="p-1 text-white hover:opacity-80 active:scale-95">
              <CloseIcon />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto w-full p-2">
            <SidebarTree
              activeRuleId={activeRuleId}
              onSelectRule={(ruleId) => {
                const cleanId = ruleId.replace("cat-", "").replace("dept-", "").replace("abc-", "");
                setActiveRuleId(cleanId);
                setDrawerOpen(false);
              }}
              onSelectCategory={(categoryId, categoryName) => {
                handleQuickCategory(categoryId, categoryName);
                setDrawerOpen(false);
              }}
              onTabChange={(tab) => {
                if (tab === "공지사항") {
                  setActiveTab("notice");
                  setDrawerOpen(false);
                }
              }}
              onSelectNotice={(noticeId) => {
                setActiveNoticeId(noticeId);
                setDrawerOpen(false);
              }}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
