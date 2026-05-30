"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import DashboardIcon from "@mui/icons-material/Dashboard";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import EditIcon from "@mui/icons-material/Edit";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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
  ];

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden font-sans text-slate-100">
      
      {/* 1. 고급 딥 네이비/블랙 계열 관리자 사이드바 */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 shadow-2xl z-20">
        
        {/* 상단 헤더 */}
        <div>
          <div className="p-6 border-b border-slate-800 flex flex-col gap-2 select-none">
            <div className="flex items-center gap-2">
              <Image
                src="/UI.png"
                alt="로고"
                width={120}
                height={28}
                className="brightness-0 invert object-contain"
              />
            </div>
            <div className="text-[11px] text-[#009b9e] font-black tracking-widest uppercase">
              관리자 시스템 포털
            </div>
          </div>

          {/* 사이드바 메뉴 리스트 */}
          <nav className="p-4 space-y-1.5 mt-4">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black transition-all cursor-pointer select-none active:scale-95 ${
                    isActive
                      ? "bg-gradient-to-r from-[#009b9e] to-[#008082] text-white shadow-md shadow-[#009b9e]/20"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 하단 푸터 - 사용자 서비스로 돌아가기 */}
        <div className="p-4 border-t border-slate-800">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-slate-700 text-xs font-black text-slate-300 hover:bg-slate-900 hover:text-white transition-all active:scale-95 cursor-pointer"
          >
            <ExitToAppIcon sx={{ fontSize: 16 }} />
            사용자 웹 화면
          </Link>
        </div>
      </aside>

      {/* 2. 우측 메인 콘텐츠 작업 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
        
        {/* 헤더 바 */}
        <header className="h-14 border-b border-slate-800 bg-slate-950/40 backdrop-blur-md px-8 flex items-center justify-between shrink-0 select-none">
          <div className="text-xs text-slate-400 font-bold">
            예원예술대학교 대학규정 디지털 정비 사업
          </div>
          
          <div className="flex items-center gap-4 text-xs font-bold text-slate-300">
            <span className="bg-[#009b9e]/10 text-[#009b9e] px-2 py-0.5 rounded border border-[#009b9e]/20 text-[10px] font-black">
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
