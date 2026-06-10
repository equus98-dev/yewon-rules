"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { CircularProgress } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import EditIcon from "@mui/icons-material/Edit";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import CampaignIcon from "@mui/icons-material/Campaign";
import FolderIcon from "@mui/icons-material/Folder";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(1800);

  useEffect(() => {
    // 로그인 페이지는 인증 검사 생략
    if (pathname === "/admin/login") {
      setAuthorized(true);
      return;
    }

    let timerId: NodeJS.Timeout;

    const checkSession = () => {
      const session = localStorage.getItem("yewon_admin_session");
      if (session && session !== "authorized") {
        const time = parseInt(session, 10);
        const elapsed = Math.floor((Date.now() - time) / 1000);
        const remaining = 1800 - elapsed;
        if (remaining > 0) {
          setAuthorized(true);
          setSessionTimeLeft(remaining);
        } else {
          setAuthorized(false);
          router.push("/admin/login");
        }
      } else if (session === "authorized") {
        setAuthorized(true);
        setSessionTimeLeft(1800);
      } else {
        setAuthorized(false);
        router.push("/admin/login");
      }
    };

    checkSession();
    timerId = setInterval(checkSession, 1000);
    return () => clearInterval(timerId);
  }, [pathname, router]);

  const handleExtendSession = () => {
    localStorage.setItem("yewon_admin_session", Date.now().toString());
    setSessionTimeLeft(1800);
  };

  const handleLogout = () => {
    localStorage.removeItem("yewon_admin_session");
    router.push("/admin/login");
  };

  // 1. 로그인 페이지는 인증 검증 없이 즉시 전면 노출 (마운트 깜빡임 제로)
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // 2. 인증 대기 중
  if (authorized !== true) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center gap-4 bg-slate-50 text-slate-800 font-sans">
        <CircularProgress size={30} sx={{ color: "#0c3161" }} />
        <span className="text-slate-500 text-xs font-semibold select-none">관리자 세션 검증 중...</span>
      </div>
    );
  }

  const menuItems = [
    { label: "대시보드", href: "/admin", icon: <DashboardIcon sx={{ fontSize: 26 }} /> },
    { label: "규정 관리", href: "/admin/rules", icon: <MenuBookIcon sx={{ fontSize: 26 }} /> },
    { label: "서식 관리", href: "/admin/files", icon: <FolderIcon sx={{ fontSize: 26 }} /> },
    { label: "입안편집기", href: "/admin/editor", icon: <EditIcon sx={{ fontSize: 26 }} /> },
    { label: "공지사항", href: "/admin/notices", icon: <CampaignIcon sx={{ fontSize: 26 }} /> },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      
      {/* 1. 상단 사용자 통합 헤더 (디자인 일치화 및 은은한 배경 추가) */}
      <header className="h-[76px] bg-[#0c3161] shadow-md flex items-center justify-between px-6 shrink-0 text-white relative z-50 select-none overflow-hidden">
        {/* Background Image Overlay */}
        <div 
          className="absolute inset-0 z-0 opacity-15 pointer-events-none" 
          style={{ backgroundImage: "url('/yewon2.jpeg')", backgroundSize: 'cover', backgroundPosition: 'center', mixBlendMode: 'screen' }}
        />
        
        <div className="flex items-center gap-4 relative z-10">
          <Link href="/admin">
            <div className="flex items-center cursor-pointer select-none drop-shadow-md">
              <Image src="/UI_white.png" alt="Yewon Logo" width={200} height={42} className="h-10 w-auto object-contain drop-shadow-md" />
              <div className="ml-3 border-l-[1.5px] border-white/30 pl-4 hidden md:flex flex-col justify-center">
                <span className="font-extrabold tracking-tight text-[22px] block opacity-95 drop-shadow-sm">규정관리시스템</span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-blue-200 opacity-90 -mt-0.5">Admin Mode</span>
              </div>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-1 hidden sm:flex">
              <span className="text-sm font-bold text-blue-100 select-none drop-shadow-sm">
                최고 관리자 님
              </span>
              <div className="flex items-center bg-[#071f3f]/80 backdrop-blur-sm rounded-full px-2 py-0.5 border border-white/10 shadow-inner">
                <span className="text-[11px] font-black text-rose-300 mr-1.5 font-mono w-[34px] text-center drop-shadow-sm">
                  {Math.floor(sessionTimeLeft / 60)}:{String(sessionTimeLeft % 60).padStart(2, "0")}
                </span>
                <button
                  onClick={handleExtendSession}
                  className="text-[10px] font-bold bg-[#0c3161] text-blue-100 border border-white/20 rounded px-1.5 py-0.5 hover:bg-white/20 transition-colors cursor-pointer active:scale-95"
                  title="세션 시간 30분으로 연장"
                >
                  연장
                </button>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-white/90 hover:text-white border border-white/30 hover:border-white/70 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg transition-all active:scale-95 shadow-sm"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 2. 하단 영역 (세로 좁은 메뉴바 + 메인 컨텐츠 꽉차게) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* 사이드바 (Dark Navy, Narrow) */}
        <aside className="w-[84px] bg-[#0c3161] border-r border-[#071f3f] flex flex-col justify-between shrink-0 shadow-[4px_0_12px_rgba(0,0,0,0.1)] z-20 relative">
          {/* Subtle gradient on top of solid color */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          
          <nav className="p-2 space-y-1 mt-3 relative z-10">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all cursor-pointer select-none group ${
                    isActive
                      ? "bg-white text-[#0c3161] shadow-md"
                      : "text-blue-200 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className={`${isActive ? "scale-110 drop-shadow-sm" : "opacity-85 group-hover:opacity-100 group-hover:scale-110 transition-all"}`}>
                    {item.icon}
                  </div>
                  <span className={`text-[11px] text-center tracking-tight leading-tight break-keep ${isActive ? "font-black" : "font-semibold"}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="p-2 mb-3 relative z-10">
            <Link
              href="/"
              className="flex flex-col items-center justify-center gap-1.5 w-full py-3 rounded-xl border border-white/10 bg-white/5 text-blue-100 hover:bg-white/15 hover:border-white/30 hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <ExitToAppIcon sx={{ fontSize: 24 }} className="opacity-90" />
              <span className="text-[10px] font-bold text-center leading-tight break-keep tracking-tight">사용자홈</span>
            </Link>
          </div>
        </aside>

        {/* 메인 콘텐츠 작업 영역 (여백 없애고 꽉차게) */}
        <main className="flex-1 overflow-y-auto scrollbar bg-slate-50 relative">
          {children}
        </main>
      </div>

      {/* 3. Session Extension Modal (10초 이하 남았을 때 표시) */}
      {sessionTimeLeft <= 10 && sessionTimeLeft > 0 && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-5 border-[4px] border-red-50">
              <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-2 tracking-tight">자동 로그아웃 임박</h2>
            <p className="text-sm text-slate-600 font-bold mb-6 leading-relaxed">
              보안을 위해 <span className="text-red-600 font-black text-base">{sessionTimeLeft}초 후</span> 세션이 만료됩니다.<br/>로그인 시간을 연장하시겠습니까?
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={handleLogout}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-black rounded-xl hover:bg-slate-200 transition-all cursor-pointer active:scale-95"
              >
                로그아웃
              </button>
              <button 
                onClick={handleExtendSession}
                className="flex-1 py-3 bg-[#0c3161] text-white font-black rounded-xl hover:bg-[#092244] transition-all shadow-lg shadow-[#0c3161]/30 cursor-pointer active:scale-95"
              >
                세션 연장하기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
