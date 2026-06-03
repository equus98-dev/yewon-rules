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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // 로그인 페이지는 인증 검사 생략
    if (pathname === "/admin/login") {
      setAuthorized(true);
      return;
    }

    // 클라이언트 사이드 인증 체크 (타임스탬프 30분 검증)
    const session = localStorage.getItem("yewon_admin_session");
    if (session && session !== "authorized") {
      const time = parseInt(session, 10);
      if (Date.now() - time < 30 * 60 * 1000) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
        router.push("/admin/login");
      }
    } else if (session === "authorized") {
      setAuthorized(true);
    } else {
      setAuthorized(false);
      router.push("/admin/login");
    }
  }, [pathname, router]);

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
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      
      {/* 1. 고급 화이트/라이트 네이비 계열 관리자 사이드바 */}
      <aside className="w-64 bg-white border-r border-slate-250 flex flex-col justify-between shrink-0 shadow-lg z-20">
        
        {/* 상단 헤더 */}
        <div>
          <div className="p-6 border-b border-slate-200 flex flex-col items-center justify-center gap-2 select-none">
            <div className="flex items-center justify-center w-full">
              <Image
                src="/UI.png"
                alt="로고"
                width={183}
                height={40}
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>
 
          {/* 사이드바 메뉴 리스트 */}
          <nav className="p-4 space-y-2 mt-4">
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
        </div>
 
        {/* 하단 푸터 - 사용자 서비스로 돌아가기 및 로그아웃 */}
        <div className="p-4 border-t border-slate-200 space-y-2.5">
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("yewon_admin_session");
              router.push("/admin/login");
            }}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-red-200 text-[13px] font-black text-red-600 hover:bg-red-50 transition-all active:scale-95 cursor-pointer"
          >
            로그아웃
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-slate-200 text-[13px] font-black text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95 cursor-pointer"
          >
            <ExitToAppIcon sx={{ fontSize: 18 }} />
            사용자 웹 화면
          </Link>
        </div>
      </aside>
 
      {/* 2. 우측 메인 콘텐츠 작업 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        
        {/* 헤더 바 */}
        <header className="h-16 border-b border-slate-250 bg-white px-8 flex items-center justify-between shrink-0 select-none">
          <div className="text-sm text-slate-500 font-bold">
            규정관리시스템 관리자 모드
          </div>
          
          <div className="flex items-center gap-4 text-sm font-bold text-slate-700">
            <span className="bg-[#0c3161]/10 text-[#0c3161] px-2.5 py-1 rounded border border-[#0c3161]/20 text-[11px] font-black">
              System Admin
            </span>
            <span>최고 관리자 님</span>
          </div>
        </header>
 
        {/* 컨텐츠 컨테이너 */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
 
    </div>
  );
}
