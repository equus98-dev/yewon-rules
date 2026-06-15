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
        const data = (await res.json()) as any;
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
      <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-slate-50">
        <CircularProgress size={30} sx={{ color: "#0c3161" }} />
        <span className="text-slate-500 text-sm font-semibold">대시보드 통계 분석 로드 중...</span>
      </div>
    );
  }

  const isDbError = stats && stats.error;

  const { counts, deptStats, revisionFeed } = stats && stats.counts ? stats : {
    counts: { rules: 0, categories: 0, departments: 0, attachments: 0 },
    deptStats: [],
    revisionFeed: [],
  };

  const statCards = [
    {
      label: "대학 규정 수",
      value: `${counts.rules}개`,
      icon: <MenuBookIcon className="text-[#0c3161]" />,
      color: "border-slate-200 bg-white",
    },
    {
      label: "분류 카테고리 수",
      value: `${counts.categories}개`,
      icon: <AccountTreeIcon className="text-amber-600" />,
      color: "border-slate-200 bg-white",
    },
    {
      label: "소관 부서 수",
      value: `${counts.departments}개`,
      icon: <BusinessIcon className="text-purple-600" />,
      color: "border-slate-200 bg-white",
    },
    {
      label: "등록 서식 및 첨부파일",
      value: `${counts.attachments}개`,
      icon: <InsertDriveFileIcon className="text-rose-600" />,
      color: "border-slate-200 bg-white",
    },
  ];

  return (
    <div className="h-full overflow-y-auto p-8 bg-slate-50 scrollbar text-slate-800">
      <div className="w-full space-y-8 pb-10 px-2">
        
        {/* 데이터베이스 오류 배너 */}
        {isDbError && (
          <div className="bg-red-50 border border-red-200 p-5 rounded-2xl text-sm text-red-700 font-bold select-none leading-relaxed shadow-sm">
            ⚠️ 데이터베이스 연결 오류: Cloudflare Pages에서 데이터베이스를 로드할 수 없습니다.<br />
            원인: {stats.error}<br />
            해결 방안: Cloudflare Pages 설정에서 <strong>DATABASE_URL</strong> 환경 변수(Secret)가 세션 풀러 주소(aws-1-ap-northeast-1.pooler.supabase.com:6543)로 바르게 추가되고 <strong>nodejs_compat</strong> 호환성 플래그가 활성화되었는지 확인한 다음 배포를 재시도해 주십시오.
          </div>
        )}

        {/* 상단 웰컴 배너 */}
        <div className="bg-gradient-to-br from-[#0c3161]/5 to-[#071c38]/5 p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h1 className="text-2xl font-black text-slate-850 tracking-tight flex items-center gap-2">
            규정관리시스템 관리 포털에 오신 것을 환영합니다!
          </h1>
          <p className="text-sm text-slate-600 font-bold mt-2 leading-relaxed">
            본 관리자 모드는 규정관리, 규정 서식(별지/별표/별첨), 입안편집기 및 공지사항을 관리할 수 있습니다.
          </p>
        </div>

        {/* 1. 통계 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((card, idx) => (
            <div
              key={idx}
              className={`border ${card.color} p-5 rounded-2xl flex items-center justify-between shadow-sm select-none hover:scale-102 transition-all`}
            >
              <div className="space-y-1">
                <span className="text-sm text-slate-550 font-black tracking-wide">{card.label}</span>
                <h3 className="text-2xl font-black text-[#0c3161] tracking-tight">{card.value}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                {card.icon}
              </div>
            </div>
          ))}
        </div>

        {/* 2. 2단 그리드 레이아웃 (부서별 분포 vs 최근 제개정 피드) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 2-1) 소관부서별 규정 비율 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="text-sm font-black text-slate-850 flex items-center gap-2 select-none">
                <span className="text-[#0c3161]">■</span> 부서별 규정 점유 통계
              </h3>
              
              <div className="space-y-5 mt-6">
                {deptStats.map((dept: any) => {
                  const percent = counts.rules > 0 ? Math.round((dept.count / counts.rules) * 100) : 0;
                  return (
                    <div key={dept.id} className="space-y-1.5 select-none">
                      <div className="flex items-center justify-between text-sm font-black">
                        <span className="text-slate-700">{dept.name}</span>
                        <span className="text-[#0c3161]">{dept.count}개 ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-105 h-2.5 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className="bg-gradient-to-r from-[#0c3161] to-blue-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 select-none">
              <span className="text-sm text-slate-450 font-bold">
                * 기획조정처, 교학지원처 등 4개 중심 소관 부서에 지능형 매핑이 완료되었습니다.
              </span>
            </div>
          </div>

          {/* 2-2) 최근 제개정 피드 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between select-none">
                <h3 className="text-sm font-black text-slate-850 flex items-center gap-2">
                  <span className="text-amber-600">■</span> 최근 제·개정 연혁 피드
                </h3>
                <span className="text-sm text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold">
                  실시간
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {revisionFeed.length === 0 ? (
                  <div className="text-center py-20 text-slate-450 text-sm font-bold">
                    제·개정 이력이 아직 존재하지 않습니다.
                  </div>
                ) : (
                  revisionFeed.map((rev: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between gap-4 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 shrink-0 select-none">
                            {rev.departmentName}
                          </span>
                          <span className="text-xs font-black bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100 shrink-0 select-none">
                            {rev.versionName}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-800 mt-1.5 truncate">
                          {rev.title} <span className="text-slate-550 font-bold">({rev.ruleNumber})</span>
                        </h4>
                      </div>
                      <div className="text-right shrink-0 select-none">
                        <div className="text-xs text-slate-500 font-bold">{rev.enactmentDate}</div>
                        <div className="text-sm text-slate-400 font-bold mt-1">{rev.announcementNumber}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 select-none">
              <Link
                href="/admin/rules"
                className="text-sm text-[#0c3161] font-black hover:text-blue-900 flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all"
              >
                규정 리스트에서 조문 개정하기
                <ArrowForwardIcon sx={{ fontSize: 12 }} />
              </Link>
            </div>
          </div>

        </div>

        {/* 3. 온라인 입안편집기 퀵 런처 배너 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-850 flex items-center gap-1.5">
              <EditIcon sx={{ fontSize: 16, color: "#0c3161" }} />
              웹 기반 실시간 입안편집기 (DLMS) 바로가기
            </h3>
            <p className="text-sm text-slate-500 font-bold">
              기존 아래 한글(HWP) 수정 및 메일 발송, 수동 압축변환(ZIP) 없이 웹 브라우저 안에서 실시간으로 대조 조문을 작성하십시오.
            </p>
          </div>
          <Link
            href="/admin/editor"
            className="bg-[#0c3161] hover:bg-[#092244] text-white text-sm font-black px-5 py-2.5 rounded-xl shadow-lg shadow-[#0c3161]/20 hover:shadow-[#0c3161]/30 active:scale-95 transition-all select-none cursor-pointer text-center whitespace-nowrap"
          >
            입안편집기 런처 기동
          </Link>
        </div>
      </div>
    </div>
  );
}
