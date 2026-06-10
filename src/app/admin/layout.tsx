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

  // 2. 인증 완료(true) 상태가 아닐 때는 대시보드 및 사이드바를 절대로 노출하지 않고 대기 화면 표시
  if (authorized !== true) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center gap-4 bg-slate-50 text-slate-800 font-sans">
        <CircularProgress size={30} sx={{ color: "#0c3161" }} />
        <span className="text-slate-500 text-xs font-semibold select-none">관리자 세션 검증 중...</span>
      </div>
    );
  }

  const menuItems = [
    {
      label: "대시보드",
      href: "/admin",
      icon: <DashboardIcon sx={{ fontSize: 18 }} />,
    },
    {
      label: "규정 관리",
      href: "/admin/rules",
      icon: <MenuBookIcon sx={{ fontSize: 18 }} />,
    },
    {
      label: "서식/규정파일 관리",
      href: "/admin/files",
      icon: <FolderIcon sx={{ fontSize: 18 }} />,
    },
    {
      label: "입안편집기 (DLMS)",
      href: "/admin/editor",
      icon: <EditIcon sx={{ fontSize: 18 }} />,
    },
    {
      label: "공지사항 관리",
      href: "/admin/notices",
      icon: <CampaignIcon sx={{ fontSize: 18 }} />,
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      
      {/* 1. 상단 사용자 통합 헤더 (디자인 일치화) */}
      <header className="h-[72px] bg-[#0c3161] shadow-lg flex items-center justify-between px-6 shrink-0 text-white relative z-50 select-none">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <div className="flex items-center cursor-pointer select-none drop-shadow-md">
              <Image src="/UI.png" alt="Yewon Logo" width={220} height={48} className="brightness-0 invert object-contain" />
              <div className="ml-3 border-l-2 border-white/30 pl-3 hidden md:block">
                <span className="font-extrabold tracking-widest text-[15px] block opacity-90">규정관리시스템</span>
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-70">Admin Mode</span>
              </div>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-1 hidden sm:flex">
              <span className="text-sm font-bold text-blue-100 select-none">
                최고 관리자 님
              </span>
              <div className="flex items-center bg-blue-900/50 rounded-full px-2 py-0.5 border border-blue-800 shadow-inner">
                <span className="text-[11px] font-black text-rose-300 mr-1.5 font-mono w-[34px] text-center">
                  {Math.floor(sessionTimeLeft / 60)}:{String(sessionTimeLeft % 60).padStart(2, "0")}
                </span>
                <button
                  onClick={handleExtendSession}
                  className="text-[10px] font-bold bg-[#0c3161] text-blue-100 border border-blue-700 rounded px-1.5 py-0.5 hover:bg-blue-800 transition-colors cursor-pointer active:scale-95"
                  title="세션 시간 30분으로 연장"
                >
                  연장
                </button>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-white/80 hover:text-white border border-white/20 hover:border-white/50 bg-white/5 px-3 py-1.5 rounded-lg transition-all active:scale-95"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 2. 하단 영역 (사이드바 + 메인 컨텐츠) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* 사이드바 */}
        <aside className="w-64 bg-white border-r border-slate-250 flex flex-col justify-between shrink-0 shadow-lg z-20">
          <nav className="p-4 space-y-2 mt-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-[14px] font-black transition-all cursor-pointer select-none active:scale-95 ${
                    isActive
                      ? "bg-[#0c3161] text-white shadow-md shadow-[#0c3161]/20"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200 space-y-2.5">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-slate-200 text-[13px] font-black text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95 cursor-pointer"
            >
              <ExitToAppIcon sx={{ fontSize: 18 }} />
              사용자 웹 화면
            </Link>
          </div>
        </aside>

        {/* 메인 콘텐츠 작업 영역 */}
        <main className="flex-1 overflow-hidden bg-slate-50">
          {children}
        </main>
      </div>

    </div>
  );
}
