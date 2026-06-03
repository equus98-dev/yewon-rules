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
        router.push("/");
      } else {
        setError("아이디 또는 비밀번호가 올바르지 않습니다.");
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden text-slate-800">
      
      {/* 1. 배경 그래디언트 글로우 데코레이션 */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-[#0c3161]/5 blur-[120px] select-none pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[120px] select-none pointer-events-none z-0"></div>
      <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:24px_24px] z-0"></div>
 
      {/* 2. 로그인 화이트 카드 박스 */}
      <div className="relative z-10 w-full max-w-md mx-4 p-8 bg-white border border-slate-200 rounded-3xl shadow-xl flex flex-col items-center">
        
        {/* 대학 로고 */}
        <div className="mb-6 flex flex-col items-center gap-1.5 select-none">
          <Image
            src="/UI.png"
            alt="예원예술대학교 로고"
            width={160}
            height={36}
            className="object-contain"
          />
          <span className="text-sm text-[#0c3161] font-black tracking-widest uppercase mt-3">
            규정관리시스템 관리자모드
          </span>
        </div>
 
        {/* 안내 문구 */}
        <p className="text-center text-sm text-slate-500 font-bold mb-6 leading-relaxed select-none">
          본 페이지는 대학규정관리시스템의 최고 관리자 통제 구역입니다.<br />
          보안을 위해 인증 키를 입력해 주십시오.
        </p>
 
        {/* 로그인 폼 */}
        <form onSubmit={handleLogin} className="w-full space-y-4">
          
          {/* 아이디 */}
          <div className="space-y-1.5 relative">
            <label className="text-xs text-slate-500 font-bold uppercase tracking-wider pl-1 select-none">Admin ID</label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="아이디를 입력하세요..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 font-bold focus:outline-none focus:ring-1 focus:ring-[#0c3161] focus:border-[#0c3161] transition-all"
              />
              <PersonIcon className="absolute left-3.5 top-3.5 text-slate-400 text-sm" sx={{ fontSize: 20 }} />
            </div>
          </div>
 
          {/* 비밀번호 */}
          <div className="space-y-1.5 relative">
            <label className="text-xs text-slate-500 font-bold uppercase tracking-wider pl-1 select-none">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 font-bold focus:outline-none focus:ring-1 focus:ring-[#0c3161] focus:border-[#0c3161] transition-all"
              />
              <LockIcon className="absolute left-3.5 top-3.5 text-slate-400 text-sm" sx={{ fontSize: 20 }} />
            </div>
          </div>
 
          {/* 에러 메시지 */}
          {error && (
            <div className="text-red-600 text-sm font-bold text-center bg-red-50 border border-red-100 py-2 rounded-lg select-none">
              {error}
            </div>
          )}
 
          {/* 로그인 단추 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0c3161] hover:bg-[#092244] text-white text-sm font-black py-3.5 rounded-xl shadow-lg shadow-[#0c3161]/10 active:scale-97 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 select-none"
          >
            {loading ? (
              <CircularProgress size={18} sx={{ color: "white" }} />
            ) : (
              "로그인 및 세션 승인"
            )}
          </button>
 
        </form>
 
        {/* 풋터 */}
        <div className="mt-8 border-t border-slate-100 pt-4 w-full text-center select-none">
          <Link
            href="/"
            className="text-sm text-slate-450 hover:text-blue-900 font-bold transition-colors"
          >
            ← 사용자 규정검색 화면으로
          </Link>
        </div>
 
      </div>
    </div>
  );
}
