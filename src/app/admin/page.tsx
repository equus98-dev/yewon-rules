"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CircularProgress } from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import BusinessIcon from "@mui/icons-material/Business";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import EditIcon from "@mui/icons-material/Edit";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error("Failed to load admin stats:", e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-slate-900">
        <CircularProgress size={30} sx={{ color: "#009b9e" }} />
        <span className="text-slate-400 text-xs font-semibold">대시보드 통계 분석 로드 중...</span>
      </div>
    );
  }

  const { counts, deptStats, revisionFeed } = stats || {
    counts: { rules: 0, categories: 0, departments: 0, attachments: 0 },
    deptStats: [],
    revisionFeed: [],
  };

  const statCards = [
    {
      label: "대학 규정 수",
      value: `${counts.rules}개`,
      icon: <MenuBookIcon className="text-[#009b9e]" />,
      color: "from-blue-500/10 to-teal-500/10 border-blue-500/20",
    },
    {
      label: "분류 카테고리 수",
      value: `${counts.categories}개`,
      icon: <AccountTreeIcon className="text-amber-500" />,
      color: "from-amber-500/10 to-orange-500/10 border-amber-500/20",
    },
    {
      label: "소관 부서 수",
      value: `${counts.departments}개`,
      icon: <BusinessIcon className="text-purple-500" />,
      color: "from-purple-500/10 to-indigo-500/10 border-purple-500/20",
    },
    {
      label: "등록 서식 및 첨부파일",
      value: `${counts.attachments}개`,
      icon: <InsertDriveFileIcon className="text-rose-500" />,
      color: "from-rose-500/10 to-red-500/10 border-rose-500/20",
    },
  ];

  return (
    <div className="h-full overflow-y-auto p-8 bg-slate-900 scrollbar">
      <div className="max-w-6xl mx-auto space-y-8 pb-10">
        
        {/* 상단 웰컴 배너 */}
        <div className="bg-gradient-to-br from-[#0c3161]/50 to-[#071c38]/50 p-6 md:p-8 rounded-2xl border border-slate-700 shadow-md">
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            규정관리시스템 관리 포털에 오신 것을 환영합니다!
          </h1>
          <p className="text-xs text-slate-400 font-bold mt-2 leading-relaxed">
            예원예술대학교 공식 규정집 데이터(213개 조항 트리 노드 및 소관 분류)가 Supabase PostgreSQL 클라우드에 성공적으로 바인딩되었습니다.<br />
            온라인 입안편집기(DLMS) 메뉴를 통하여 실시간 규정 제·개정 및 신구대비표 생성을 편리하게 수행하십시오.
          </p>
        </div>

        {/* 1. 통계 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((card, idx) => (
            <div
              key={idx}
              className={`bg-gradient-to-br ${card.color} border p-5 rounded-2xl flex items-center justify-between shadow-sm select-none hover:scale-102 transition-all`}
            >
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 font-black tracking-wide">{card.label}</span>
                <h3 className="text-2xl font-black text-white tracking-tight">{card.value}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-950/40 flex items-center justify-center shrink-0 border border-slate-800">
                {card.icon}
              </div>
            </div>
          ))}
        </div>

        {/* 2. 2단 그리드 레이아웃 (부서별 분포 vs 최근 제개정 피드) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 2-1) 소관부서별 규정 비율 */}
          <div className="bg-slate-950/40 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2 select-none">
                <span className="text-[#009b9e]">■</span> 부서별 규정 점유 통계
              </h3>
              
              <div className="space-y-5 mt-6">
                {deptStats.map((dept: any) => {
                  const percent = counts.rules > 0 ? Math.round((dept.count / counts.rules) * 100) : 0;
                  return (
                    <div key={dept.id} className="space-y-1.5 select-none">
                      <div className="flex items-center justify-between text-xs font-black">
                        <span className="text-slate-300">{dept.name}</span>
                        <span className="text-[#009b9e]">{dept.count}개 ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700/50">
                        <div
                          className="bg-gradient-to-r from-[#009b9e] to-teal-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800/60 select-none">
              <span className="text-[10px] text-slate-500 font-bold">
                * 기획조정처, 교학지원처 등 4개 중심 소관 부서에 지능형 매핑이 완료되었습니다.
              </span>
            </div>
          </div>

          {/* 2-2) 최근 제개정 피드 */}
          <div className="bg-slate-950/40 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between select-none">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="text-amber-500">■</span> 최근 제·개정 연혁 피드
                </h3>
                <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  실시간
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {revisionFeed.length === 0 ? (
                  <div className="text-center py-20 text-slate-500 text-xs font-bold">
                    제·개정 이력이 아직 존재하지 않습니다.
                  </div>
                ) : (
                  revisionFeed.map((rev: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-4 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 shrink-0 select-none">
                            {rev.departmentName}
                          </span>
                          <span className="text-[9px] font-black bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0 select-none">
                            {rev.versionName}
                          </span>
                        </div>
                        <h4 className="text-[11px] font-black text-slate-200 mt-1.5 truncate">
                          {rev.title} <span className="text-slate-500 font-bold">({rev.ruleNumber})</span>
                        </h4>
                      </div>
                      <div className="text-right shrink-0 select-none">
                        <div className="text-[9px] text-slate-400 font-bold">{rev.enactmentDate}</div>
                        <div className="text-[8px] text-slate-500 font-bold mt-1">{rev.announcementNumber}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/60 select-none">
              <Link
                href="/admin/rules"
                className="text-[11px] text-[#009b9e] font-black hover:text-white flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all"
              >
                규정 리스트에서 조문 개정하기
                <ArrowForwardIcon sx={{ fontSize: 12 }} />
              </Link>
            </div>
          </div>

        </div>

        {/* 3. 온라인 입안편집기 퀵 런처 배너 */}
        <div className="bg-gradient-to-br from-indigo-950/30 via-slate-950/40 to-teal-950/30 p-6 rounded-2xl border border-indigo-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md shadow-indigo-950/20">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-100 flex items-center gap-1.5">
              <EditIcon sx={{ fontSize: 16, color: "#009b9e" }} />
              웹 기반 실시간 입안편집기 (DLMS) 바로가기
            </h3>
            <p className="text-[11px] text-slate-400 font-bold">
              기존 아래 한글(HWP) 수정 및 메일 발송, 수동 압축변환(ZIP) 없이 웹 브라우저 안에서 실시간으로 대조 조문을 작성하십시오.
            </p>
          </div>
          <Link
            href="/admin/editor"
            className="bg-[#009b9e] hover:bg-[#008082] text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-lg shadow-[#009b9e]/20 hover:shadow-[#009b9e]/30 active:scale-95 transition-all select-none cursor-pointer text-center whitespace-nowrap"
          >
            입안편집기 런처 기동
          </Link>
        </div>

      </div>
    </div>
  );
}
