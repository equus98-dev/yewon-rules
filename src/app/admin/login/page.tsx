"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CircularProgress } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // 0.8초의 인공 대기시간을 두어 고급스러운 로딩 애니메이션 유도
    setTimeout(() => {
      if (username === "admin" && password === "yewon0555") {
        // 세션 인증 키 발급 (30분 유지시간 설정을 위해 현재 타임스탬프 저장)
        localStorage.setItem("yewon_admin_session", Date.now().toString());
        router.push("/admin");
      } else {
        setError("아이디 또는 비밀번호가 올바르지 않습니다.");
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex bg-white text-slate-800">
      
      {/* 1. 좌측 대형 전경 이미지 (데스크탑에서만 렌더링) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0c3161] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c3161]/80 via-transparent to-transparent z-10" />
        <Image 
          src="/yewon2.jpeg" 
          alt="예원예술대학교 전경" 
          fill 
          priority 
          className="object-cover opacity-90 z-0"
        />
        <div className="absolute bottom-16 left-12 z-20 text-white select-none">
          <h2 className="text-4xl lg:text-5xl font-black mb-3 drop-shadow-lg tracking-tight">Yewon Arts University</h2>
          <p className="text-xl font-bold text-blue-100 drop-shadow-md">규정관리시스템 관리자 전용 통제구역</p>
        </div>
      </div>

      {/* 2. 우측 로그인 폼 영역 */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center relative bg-slate-50 lg:bg-white overflow-hidden">
        
        {/* 모바일용 배경 데코레이션 */}
        <div className="lg:hidden absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-[#0c3161]/5 blur-[100px] z-0 pointer-events-none" />
        
        <div className="relative z-10 w-full max-w-[420px] px-8 py-10 lg:p-0 bg-white lg:bg-transparent border lg:border-none border-slate-200 rounded-3xl lg:rounded-none shadow-2xl lg:shadow-none flex flex-col items-center">
          
          {/* 대학 로고 */}
          <div className="mb-8 flex flex-col items-center gap-1.5 select-none w-full">
            <Image
              src="/UI.png"
              alt="예원예술대학교 로고"
              width={200}
              height={45}
              className="object-contain"
            />
            <span className="text-sm text-[#0c3161] font-black tracking-widest uppercase mt-4">
              Rule Management System
            </span>
          </div>
   
          {/* 안내 문구 */}
          <p className="text-center text-sm text-slate-500 font-bold mb-8 leading-relaxed select-none w-full">
            본 페이지는 시스템 관리를 위한 최고 권한 구역입니다.<br />
            보안을 위해 관리자 인증 키를 입력해 주십시오.
          </p>
   
          {/* 로그인 폼 */}
          <form onSubmit={handleLogin} className="w-full space-y-5">
            
            {/* 아이디 */}
            <div className="space-y-2 relative">
              <label className="text-[11px] text-slate-500 font-black uppercase tracking-widest pl-1 select-none">Admin ID</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="아이디를 입력하세요..."
                  className="w-full bg-slate-50 lg:bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-[15px] text-slate-800 placeholder-slate-400 font-bold focus:outline-none focus:ring-2 focus:ring-[#0c3161]/50 focus:border-[#0c3161] transition-all shadow-sm"
                />
                <PersonIcon className="absolute left-4 top-3.5 text-slate-400" sx={{ fontSize: 22 }} />
              </div>
            </div>
   
            {/* 비밀번호 */}
            <div className="space-y-2 relative">
              <label className="text-[11px] text-slate-500 font-black uppercase tracking-widest pl-1 select-none">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요..."
                  className="w-full bg-slate-50 lg:bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-[15px] text-slate-800 placeholder-slate-400 font-bold focus:outline-none focus:ring-2 focus:ring-[#0c3161]/50 focus:border-[#0c3161] transition-all shadow-sm"
                />
                <LockIcon className="absolute left-4 top-3.5 text-slate-400" sx={{ fontSize: 22 }} />
              </div>
            </div>
   
            {/* 에러 메시지 */}
            {error && (
              <div className="text-red-600 text-[13px] font-bold text-center bg-red-50 border border-red-100 py-2.5 rounded-lg select-none shadow-sm mt-2">
                {error}
              </div>
            )}
   
            {/* 로그인 단추 */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0c3161] hover:bg-[#092244] text-white text-[15px] font-black py-4 rounded-xl shadow-lg shadow-[#0c3161]/20 hover:shadow-[#0c3161]/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none"
              >
                {loading ? (
                  <CircularProgress size={20} sx={{ color: "white" }} />
                ) : (
                  "관리자 세션 승인"
                )}
              </button>
            </div>
   
          </form>
   
          {/* 풋터 */}
          <div className="mt-10 pt-6 w-full text-center select-none border-t border-slate-100/60">
            <Link
              href="/"
              className="text-[13px] text-slate-400 hover:text-[#0c3161] font-extrabold transition-colors flex items-center justify-center gap-1"
            >
              ← 사용자 시스템으로 돌아가기
            </Link>
          </div>
   
        </div>
      </div>
    </div>
  );
}
