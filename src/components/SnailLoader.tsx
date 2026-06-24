"use client";

import React from "react";

/**
 * 🐌 SnailLoader - 귀여운 달팽이 로딩 애니메이션 컴포넌트
 * 순수 CSS 애니메이션으로 제작된 오리지널 달팽이 캐릭터가
 * 프로그레스 바 위를 천천히 이동하며 로딩 상태를 표시합니다.
 */
export default function SnailLoader({ message = "규정 데이터를 가져오는 중..." }: { message?: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[55vh] gap-6 bg-gradient-to-b from-[#f0f9f4] to-[#e8f4f8] p-6 select-none">
      {/* 달팽이 + 프로그레스 바 영역 */}
      <div className="relative w-[260px] h-[120px]">
        {/* 달팽이 캐릭터 - CSS로 직접 그린 오리지널 디자인 */}
        <div className="absolute bottom-[38px] animate-snail-walk" style={{ left: '10%' }}>
          {/* 달팽이 본체 */}
          <div className="relative">
            {/* 더듬이 2개 */}
            <div className="absolute -top-[22px] left-[12px] flex gap-[8px]">
              {/* 왼쪽 더듬이 */}
              <div className="flex flex-col items-center animate-antenna-sway">
                <div className="w-[7px] h-[7px] rounded-full bg-[#2d3436] shadow-sm" />
                <div className="w-[2px] h-[14px] bg-[#636e72] rounded-full" />
              </div>
              {/* 오른쪽 더듬이 */}
              <div className="flex flex-col items-center animate-antenna-sway-delay">
                <div className="w-[7px] h-[7px] rounded-full bg-[#2d3436] shadow-sm" />
                <div className="w-[2px] h-[14px] bg-[#636e72] rounded-full" />
              </div>
            </div>

            {/* 껍데기 (소라) */}
            <div className="w-[42px] h-[42px] rounded-full bg-gradient-to-br from-[#74b9ff] via-[#0984e3] to-[#6c5ce7] shadow-lg border-[3px] border-[#dfe6e9] relative overflow-hidden">
              {/* 소라 나선 무늬 */}
              <div className="absolute inset-[5px] rounded-full border-[2.5px] border-[#a29bfe]/60" />
              <div className="absolute inset-[11px] rounded-full border-[2px] border-[#dfe6e9]/50" />
              <div className="absolute inset-[15px] rounded-full bg-[#6c5ce7]/30" />
              {/* 하이라이트 */}
              <div className="absolute top-[4px] left-[6px] w-[8px] h-[5px] bg-white/50 rounded-full rotate-[-30deg]" />
            </div>

            {/* 몸통 (머리 + 꼬리) */}
            <div className="absolute bottom-0 -right-[18px] w-[28px] h-[16px] bg-[#ffeaa7] rounded-r-[12px] rounded-l-[4px] border-b-[2px] border-[#fdcb6e]">
              {/* 눈 */}
              <div className="absolute top-[2px] right-[6px] flex gap-[4px]">
                <div className="w-[5px] h-[5px] rounded-full bg-[#2d3436] relative">
                  <div className="absolute top-[0.5px] left-[1px] w-[2px] h-[2px] rounded-full bg-white" />
                </div>
                <div className="w-[5px] h-[5px] rounded-full bg-[#2d3436] relative">
                  <div className="absolute top-[0.5px] left-[1px] w-[2px] h-[2px] rounded-full bg-white" />
                </div>
              </div>
              {/* 뺨 홍조 */}
              <div className="absolute bottom-[3px] right-[4px] w-[5px] h-[3px] rounded-full bg-[#fab1a0]/60" />
              {/* 입 (미소) */}
              <div className="absolute bottom-[2px] right-[10px] w-[4px] h-[2px] border-b-[1.5px] border-[#e17055] rounded-b-full" />
            </div>
            {/* 꼬리쪽 몸통 */}
            <div className="absolute bottom-0 -left-[8px] w-[16px] h-[10px] bg-[#ffeaa7] rounded-l-[8px] border-b-[2px] border-[#fdcb6e]" />
          </div>
        </div>

        {/* 달팽이 점액 트레일 (도트) */}
        <div className="absolute bottom-[34px] left-[8%] flex gap-[12px] animate-trail-fade">
          <div className="w-[4px] h-[4px] rounded-full bg-[#81ecec]/40" />
          <div className="w-[3px] h-[3px] rounded-full bg-[#81ecec]/30" />
          <div className="w-[2px] h-[2px] rounded-full bg-[#81ecec]/20" />
        </div>

        {/* 프로그레스 바 */}
        <div className="absolute bottom-[12px] left-0 w-full">
          <div className="w-full h-[22px] bg-[#dfe6e9] rounded-full overflow-hidden shadow-inner border border-[#b2bec3]/40 relative">
            {/* 프로그레스 채우기 (무한 애니메이션) */}
            <div className="h-full rounded-full bg-gradient-to-r from-[#00cec9] via-[#55efc4] to-[#81ecec] animate-progress-fill relative overflow-hidden">
              {/* 반짝임 효과 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
            {/* 프로그레스 바 위의 줄무늬 패턴 */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.1) 8px, rgba(0,0,0,0.1) 10px)' }} />
          </div>
        </div>

        {/* "LOADING..." 텍스트 (프로그레스 바 아래) */}
        <div className="absolute -bottom-[2px] left-0 w-full text-center">
          <span className="text-[11px] font-black tracking-[4px] text-[#636e72] uppercase animate-pulse">
            loading...
          </span>
        </div>
      </div>

      {/* 메시지 */}
      <div className="text-center mt-2">
        <h3 className="text-[17px] font-black text-[#0c3161] tracking-tight leading-relaxed">
          {message}
        </h3>
        <p className="text-[12px] text-slate-400 font-bold mt-1.5 flex items-center justify-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00cec9] animate-ping" />
          천천히 하지만 확실하게 가져올게요!
        </p>
      </div>

      {/* CSS 애니메이션 정의 */}
      <style jsx>{`
        @keyframes snailWalk {
          0% { transform: translateX(0); }
          100% { transform: translateX(160px); }
        }
        @keyframes antennaSway {
          0%, 100% { transform: rotate(-8deg); }
          50% { transform: rotate(8deg); }
        }
        @keyframes antennaSwayDelay {
          0%, 100% { transform: rotate(5deg); }
          50% { transform: rotate(-10deg); }
        }
        @keyframes progressFill {
          0% { width: 5%; }
          50% { width: 65%; }
          80% { width: 85%; }
          100% { width: 5%; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes trailFade {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.15; }
        }
        .animate-snail-walk {
          animation: snailWalk 6s ease-in-out infinite alternate;
        }
        .animate-antenna-sway {
          animation: antennaSway 1.2s ease-in-out infinite;
        }
        .animate-antenna-sway-delay {
          animation: antennaSwayDelay 1.4s ease-in-out infinite;
          animation-delay: 0.2s;
        }
        .animate-progress-fill {
          animation: progressFill 6s ease-in-out infinite;
        }
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
        .animate-trail-fade {
          animation: trailFade 2s ease-in-out infinite, snailWalk 6s ease-in-out infinite alternate;
          transform-origin: left;
        }
      `}</style>
    </div>
  );
}
