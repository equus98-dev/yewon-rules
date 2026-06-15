"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import CompareView from "@/components/CompareView";
import { CircularProgress } from "@mui/material";

export default function ComparePage() {
  const searchParams = useSearchParams();
  const ruleId = searchParams.get("ruleId");
  
  const [ruleData, setRuleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRule() {
      if (!ruleId) return;
      try {
        const res = await fetch(`/api/rules/${ruleId}?t=${Date.now()}`);
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json() as any;
        setRuleData(data);
      } catch (error) {
        console.error("Failed to load rule detail:", error);
      } finally {
        setLoading(false);
      }
    }
    loadRule();
  }, [ruleId]);

  if (!ruleId) {
    return <div className="flex items-center justify-center h-screen bg-slate-100">규정 ID가 필요합니다.</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <CircularProgress />
      </div>
    );
  }

  if (!ruleData) {
    return <div className="flex items-center justify-center h-screen bg-slate-100 text-slate-500">규정 데이터를 불러올 수 없습니다.</div>;
  }

  return (
    <div className="h-screen w-full bg-slate-100 overflow-hidden flex flex-col">
      <div className="h-14 bg-white border-b border-slate-200 flex items-center px-6 shrink-0 shadow-sm">
        <h1 className="text-lg font-bold text-slate-800">
          <span className="text-purple-600 mr-2">[신구대비표]</span>
          {ruleData.title}
        </h1>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <CompareView currentRevision={ruleData.currentRevision} allRevisions={ruleData.revisions} />
      </div>
    </div>
  );
}
