"use client";

import React from "react";

/**
 * 🐌 SnailLoader - 손으로 그린 듯한 만화풍 달팽이 로딩 애니메이션
 * SVG 아트로 제작된 스케치 스타일 달팽이 캐릭터 + 사선 줄무늬 프로그레스 바
 */
export default function SnailLoader({ message = "규정 데이터를 가져오는 중..." }: { message?: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[55vh] gap-5 bg-gradient-to-b from-[#f5f8f5] to-[#eaf3f0] p-6 select-none">

      {/* 달팽이 + 프로그레스 바 전체 영역 */}
      <div className="relative w-[280px] h-[150px]">

        {/* 달팽이 SVG 캐릭터 (손그림 만화풍) */}
        <div className="absolute bottom-[48px] animate-snail-walk" style={{ left: '5%' }}>
          <svg width="95" height="85" viewBox="0 0 95 85" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* 껍데기 (소라) - 큰 원 (뒤에 먼저 그림) */}
            <ellipse cx="35" cy="48" rx="24" ry="23" fill="#81d4fa" stroke="#2d3436" strokeWidth="3" />
            {/* 소라 나선 1 */}
            <path d="M35 35 C45 35, 49 42, 47 50 C45 56, 39 58, 35 55" stroke="#4fc3f7" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            {/* 소라 나선 2 */}
            <path d="M35 42 C41 42, 43 46, 41 50" stroke="#29b6f6" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* 소라 중심 */}
            <circle cx="37" cy="47" r="3.5" fill="#4fc3f7" stroke="#29b6f6" strokeWidth="1.5" />
            {/* 껍데기 하이라이트 */}
            <path d="M21 38 C23 34, 27 32, 31 33" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6" />

            {/* 몸통 (꼬리 쪽) */}
            <path d="M17 62 C11 58, 7 60, 5 65 C3 70, 9 72, 17 72 Z" fill="#ffeaa7" stroke="#2d3436" strokeWidth="2.8" strokeLinejoin="round" />
            {/* 몸통 (머리 쪽) - 껍데기 앞에 나온 머리 */}
            <path d="M52 58 C57 48, 67 44, 76 47 C83 50, 86 57, 82 64 C78 69, 64 73, 52 72 Z" fill="#ffeaa7" stroke="#2d3436" strokeWidth="2.8" strokeLinejoin="round" />
            {/* 몸통 아래 (배) */}
            <path d="M5 68 C5 72, 17 76, 42 76 C62 76, 82 72, 82 66" stroke="#2d3436" strokeWidth="2.5" strokeLinecap="round" fill="none" />

            {/* 볼 홍조 */}
            <ellipse cx="76" cy="56" rx="4" ry="2.5" fill="#fab1a0" opacity="0.7" />
            {/* 입 (미소) */}
            <path d="M70 59 C72 62, 76 62, 78 59" stroke="#2d3436" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* 왼쪽 눈 줄기 (머리 위에서 올라감) */}
            <path d="M65 48 C63 38, 61 26, 59 14" stroke="#2d3436" strokeWidth="3" strokeLinecap="round" fill="none" className="animate-antenna-sway" style={{ transformOrigin: '65px 48px' }} />
            {/* 왼쪽 눈알 */}
            <circle cx="58" cy="12" r="6.5" fill="white" stroke="#2d3436" strokeWidth="2.5" className="animate-antenna-sway" style={{ transformOrigin: '65px 48px' }} />
            <circle cx="59" cy="11" r="3.2" fill="#2d3436" className="animate-antenna-sway" style={{ transformOrigin: '65px 48px' }} />
            <circle cx="60.5" cy="9.5" r="1.3" fill="white" className="animate-antenna-sway" style={{ transformOrigin: '65px 48px' }} />

            {/* 오른쪽 눈 줄기 (머리 위에서 올라감) */}
            <path d="M74 46 C74 36, 76 26, 77 12" stroke="#2d3436" strokeWidth="3" strokeLinecap="round" fill="none" className="animate-antenna-sway-r" style={{ transformOrigin: '74px 46px' }} />
            {/* 오른쪽 눈알 */}
            <circle cx="77" cy="10" r="6.5" fill="white" stroke="#2d3436" strokeWidth="2.5" className="animate-antenna-sway-r" style={{ transformOrigin: '74px 46px' }} />
            <circle cx="78" cy="9" r="3.2" fill="#2d3436" className="animate-antenna-sway-r" style={{ transformOrigin: '74px 46px' }} />
            <circle cx="79.5" cy="7.5" r="1.3" fill="white" className="animate-antenna-sway-r" style={{ transformOrigin: '74px 46px' }} />
          </svg>
        </div>

        {/* 점액 트레일 도트 */}
        <div className="absolute bottom-[40px] left-[3%] flex gap-[14px] animate-trail-fade">
          <div className="w-[5px] h-[5px] rounded-full bg-[#81ecec]/50 border border-[#636e72]/20" />
          <div className="w-[4px] h-[4px] rounded-full bg-[#81ecec]/35 border border-[#636e72]/15" />
          <div className="w-[3px] h-[3px] rounded-full bg-[#81ecec]/20" />
        </div>

        {/* 프로그레스 바 (손그림 스타일 - 둥글고 사선줄무늬) */}
        <div className="absolute bottom-[14px] left-0 w-full">
          <div className="w-full h-[26px] bg-[#dfe6e9] rounded-full overflow-hidden relative"
               style={{ border: '3px solid #2d3436', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
            {/* 프로그레스 채우기 */}
            <div className="h-full rounded-full bg-[#b2e6e8] animate-progress-fill relative overflow-hidden">
              {/* 사선 줄무늬 패턴 (첨부이미지 스타일) */}
              <div className="absolute inset-0" style={{
                backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 5px, rgba(255,255,255,0.4) 5px, rgba(255,255,255,0.4) 10px)',
                backgroundSize: '14px 14px'
              }} />
            </div>
          </div>
        </div>

        {/* "LOADING..." 텍스트 (손글씨풍) */}
        <div className="absolute -bottom-[6px] left-0 w-full text-center">
          <span className="text-[15px] tracking-[5px] text-[#2d3436] animate-pulse"
                style={{ fontFamily: "'Comic Neue', 'Gaegu', cursive", fontWeight: 700 }}>
            LOADING...
          </span>
        </div>
      </div>

      {/* 메시지 */}
      <div className="text-center mt-3">
        <h3 className="text-[17px] font-black text-[#0c3161] tracking-tight leading-relaxed">
          {message}
        </h3>
        <p className="text-[12px] text-slate-400 font-bold mt-1.5 flex items-center justify-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00cec9] animate-ping" />
          천천히 하지만 확실하게 가져올게요!
        </p>
      </div>

      {/* Google Font 로드 (손글씨 폰트) */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Gaegu:wght@700&display=swap" rel="stylesheet" />

      {/* CSS 애니메이션 정의 */}
      <style jsx>{`
        @keyframes snailWalk {
          0% { transform: translateX(0); }
          25% { transform: translateX(40px); }
          50% { transform: translateX(90px); }
          75% { transform: translateX(130px); }
          100% { transform: translateX(155px); }
        }
        @keyframes antennaSway {
          0%, 100% { transform: rotate(-6deg); }
          50% { transform: rotate(6deg); }
        }
        @keyframes antennaSwayR {
          0%, 100% { transform: rotate(4deg); }
          50% { transform: rotate(-8deg); }
        }
        @keyframes progressFill {
          0% { width: 8%; }
          25% { width: 30%; }
          50% { width: 50%; }
          75% { width: 68%; }
          100% { width: 85%; }
        }
        @keyframes trailFade {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0.1; }
        }
        .animate-snail-walk {
          animation: snailWalk 5s ease-in-out infinite alternate;
        }
        .animate-antenna-sway {
          animation: antennaSway 1s ease-in-out infinite;
        }
        .animate-antenna-sway-r {
          animation: antennaSwayR 1.2s ease-in-out infinite;
        }
        .animate-progress-fill {
          animation: progressFill 5s ease-in-out infinite alternate;
        }
        .animate-trail-fade {
          animation: trailFade 2s ease-in-out infinite, snailWalk 5s ease-in-out infinite alternate;
          transform-origin: left;
        }
      `}</style>
    </div>
  );
}
