"use client";

import React from "react";
import SnailLoader from "@/components/SnailLoader";

export default function LoadingPreview() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f9f4] to-[#e8f4f8] flex flex-col items-center justify-center">
      <SnailLoader message="달팽이 로딩 애니메이션 미리보기 🐌" />
      <div className="mt-8 text-center">
        <p className="text-sm text-slate-500 font-bold">이 페이지는 로딩 애니메이션 미리보기 전용입니다.</p>
        <a href="/" className="text-blue-600 hover:underline text-sm font-black mt-2 inline-block">← 메인으로 돌아가기</a>
      </div>
    </div>
  );
}
