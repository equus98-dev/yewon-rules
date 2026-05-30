"use client";

import React, { useState, useEffect } from "react";
import useRouter from "next/navigation";
import {
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useRouter as useNextRouter } from "next/navigation";

export default function AdminRulesManagement() {
  const router = useNextRouter();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  
  // 신규 규정 등록 모달 상태
  const [openCreate, setOpenCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newRuleNum, setNewRuleNum] = useState("");
  const [newCatId, setNewCatId] = useState("");
  const [newDeptId, setNewDeptId] = useState("");
  const [newEnactmentDate, setNewEnactmentDate] = useState("");
  const [newAnnounceNum, setNewAnnounceNum] = useState("");
  const [newFileUrl, setNewFileUrl] = useState("");
  const [creating, setCreating] = useState(false);

  // 데이터 로드
  useEffect(() => {
    async function loadData() {
      try {
        const [rulesRes, catsRes, deptsRes] = await Promise.all([
          fetch("/api/admin/rules"),
          fetch("/api/categories?type=field"),
          fetch("/api/categories?type=dept"),
        ]);
        
        const rulesData = await rulesRes.json();
        setRules(rulesData);

        // 카테고리 트리에서 1뎁스/2뎁스 리스트 평탄화
        const catsData = await catsRes.json();
        const flatCats: any[] = [];
        function flattenCats(nodes: any[]) {
          nodes.forEach((n) => {
            flatCats.push({ id: n.id.replace("cat-", ""), name: n.name });
            if (Array.isArray(n.children)) {
              flattenCats(n.children.filter((c: any) => c.type === "folder"));
            }
          });
        }
        flattenCats(catsData);
        setCategories(flatCats);

        // 부서 목록 가공
        const deptsData = await deptsRes.json();
        const deptList = deptsData.map((d: any) => ({
          id: d.id.replace("dept-", ""),
          name: d.name,
        }));
        setDepartments(deptList);

      } catch (e) {
        console.error("Failed to load admin rules data:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 규정 폐지 / 복구 토글 핸들러
  const handleToggleStatus = async (ruleId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "EFFECTIVE" ? "ABOLISHED" : "EFFECTIVE";
    const confirmMessage =
      currentStatus === "EFFECTIVE"
        ? "이 규정을 폐지(ABOLISHED) 처리하시겠습니까? 사용자 화면에 취소선이 표시됩니다."
        : "이 규정을 현행(EFFECTIVE) 상태로 복구하시겠습니까?";
        
    if (!confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/admin/rules?id=${ruleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setRules((prev) =>
          prev.map((r) => (r.id === ruleId ? { ...r, status: nextStatus } : r))
        );
      } else {
        alert("상태 변경에 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("네트워크 오류 발생");
    }
  };

  // 신규 규정(제정) 등록 등록 버튼
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newRuleNum || !newCatId || !newDeptId || !newEnactmentDate) {
      alert("필수 항목을 모두 입력하십시오.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          ruleNumber: newRuleNum,
          categoryId: newCatId,
          departmentId: newDeptId,
          enactmentDate: newEnactmentDate,
          announcementNumber: newAnnounceNum,
          fileUrl: newFileUrl,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("규정 제정 등록이 성공적으로 완료되었습니다!");
        window.location.reload();
      } else {
        alert(data.error || "등록 실패");
      }
    } catch (e) {
      console.error(e);
      alert("네트워크 오류 발생");
    } finally {
      setCreating(false);
    }
  };

  const filteredRules = rules.filter(
    (r) =>
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ruleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.departmentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-slate-900">
        <CircularProgress size={30} sx={{ color: "#009b9e" }} />
        <span className="text-slate-400 text-xs font-semibold">대학 규정 색인 목록 로드 중...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900">
      
      {/* 1. 상단 액션 툴바 */}
      <div className="bg-slate-950/40 border-b border-slate-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 select-none">
        
        {/* 검색 영역 */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="규정명, 번호, 소관부서 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-10 py-2 text-xs text-white placeholder-slate-500 font-bold focus:outline-none focus:ring-1 focus:ring-[#009b9e] focus:border-[#009b9e]"
          />
          <SearchIcon className="absolute left-3 top-2.5 text-slate-500 text-sm" />
        </div>

        {/* 신규 등록 버튼 */}
        <button
          type="button"
          onClick={() => setOpenCreate(true)}
          className="bg-[#009b9e] hover:bg-[#008082] text-white text-xs font-black px-4.5 py-2.5 rounded-xl shadow-lg shadow-[#009b9e]/10 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <AddIcon sx={{ fontSize: 16 }} />
          신규 규정 제정 등록
        </button>
      </div>

      {/* 2. 메인 규정 테이블 영역 */}
      <div className="flex-1 overflow-auto p-8 scrollbar">
        <div className="max-w-6xl mx-auto bg-slate-950/20 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/50 border-b border-slate-800 text-slate-400 select-none text-[11px]">
                <th className="py-4 px-4 font-black w-14 text-center">번호</th>
                <th className="py-4 px-4 font-black">규정명 / 분류</th>
                <th className="py-4 px-4 font-black w-24 text-center">규정번호</th>
                <th className="py-4 px-4 font-black w-24 text-center">소관부서</th>
                <th className="py-4 px-4 font-black w-20 text-center">제·개정일</th>
                <th className="py-4 px-4 font-black w-20 text-center">상태</th>
                <th className="py-4 px-4 font-black w-48 text-center">작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center text-slate-500 font-bold bg-slate-950/10">
                    검색 결과에 부합하는 대학 규정이 존재하지 않습니다.
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule, idx) => {
                  const isAbolished = rule.status === "ABOLISHED";
                  return (
                    <tr
                      key={rule.id}
                      className="border-b border-slate-800/50 hover:bg-slate-950/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-center text-slate-500 font-bold select-none">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#009b9e]/10 text-[#009b9e] px-1.5 py-0.5 rounded text-[9px] font-black border border-[#009b9e]/20 select-none shrink-0">
                            {rule.categoryName}
                          </span>
                          <span className={`text-slate-100 font-bold hover:text-[#009b9e] cursor-pointer transition-colors ${isAbolished ? "line-through text-slate-600" : ""}`}>
                            {rule.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-300 font-bold">{rule.ruleNumber}</td>
                      <td className="py-3 px-4 text-center select-none">
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-black border border-slate-700/50">
                          {rule.departmentName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-400 font-bold select-none">{rule.enactmentDate}</td>
                      <td className="py-3 px-4 text-center select-none">
                        {isAbolished ? (
                          <span className="text-red-500 font-black bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded text-[9px]">
                            폐지
                          </span>
                        ) : (
                          <span className="text-[#009b9e] font-black bg-[#009b9e]/10 border border-[#009b9e]/20 px-2 py-0.5 rounded text-[9px]">
                            현행
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center select-none flex items-center justify-center gap-1.5">
                        
                        {/* 1) 조문 개정 (온라인 입안편집기로 진입) */}
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/editor?ruleId=${rule.id}`)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 text-[10px] font-black cursor-pointer transition-all active:scale-95 flex items-center gap-1 shadow-sm"
                        >
                          <EditIcon sx={{ fontSize: 11 }} />
                          조문 개정
                        </button>

                        {/* 2) 폐지 / 복구 토글 */}
                        {isAbolished ? (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(rule.id, rule.status)}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-[10px] font-black cursor-pointer transition-all active:scale-95 flex items-center gap-1 shadow-sm"
                          >
                            <CheckCircleIcon sx={{ fontSize: 11 }} />
                            현행 복구
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(rule.id, rule.status)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/20 text-[10px] font-black cursor-pointer transition-all active:scale-95 flex items-center gap-1 shadow-sm"
                          >
                            <BlockIcon sx={{ fontSize: 11 }} />
                            규정 폐지
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. 신규 제정 등록 모달 */}
      <Dialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          "& .MuiPaper-root": {
            bgcolor: "#0f172a", // slate-900
            color: "white",
            border: "1px solid #334155", // slate-700
            borderRadius: "16px",
          },
        }}
      >
        <DialogTitle className="text-sm font-black border-b border-slate-800 text-slate-100 flex items-center gap-2">
          <AddIcon sx={{ fontSize: 18, color: "#009b9e" }} />
          신규 규정 제정 등록 (입안 기초 마스터)
        </DialogTitle>
        <form onSubmit={handleCreateRule}>
          <DialogContent className="space-y-4 pt-5 pb-6">
            
            {/* 규정명 */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">규정명 (필수)</label>
              <input
                type="text"
                required
                placeholder="예: 대학평의원회 운영 규정"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 font-bold focus:outline-none focus:ring-1 focus:ring-[#009b9e]"
              />
            </div>

            {/* 규정 분류 코드 & 규정번호 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">규정번호 (필수)</label>
                <input
                  type="text"
                  required
                  placeholder="예: 제2-0-5호"
                  value={newRuleNum}
                  onChange={(e) => setNewRuleNum(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 font-bold focus:outline-none focus:ring-1 focus:ring-[#009b9e]"
                />
              </div>

              {/* 제정 공포일 */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">제정일자 (필수)</label>
                <input
                  type="date"
                  required
                  value={newEnactmentDate}
                  onChange={(e) => setNewEnactmentDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-[#009b9e]"
                />
              </div>
            </div>

            {/* 분류 카테고리 & 소관 부서 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 flex flex-col">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">분류 카테고리 (필수)</label>
                <select
                  required
                  value={newCatId}
                  onChange={(e) => setNewCatId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-[#009b9e]"
                >
                  <option value="" disabled>카테고리 선택</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 flex flex-col">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">소관 부서 (필수)</label>
                <select
                  required
                  value={newDeptId}
                  onChange={(e) => setNewDeptId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-[#009b9e]"
                >
                  <option value="" disabled>부서 선택</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 공포번호 & 원본 다운로드 한글/PDF URL */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">공포 기호/번호</label>
                <input
                  type="text"
                  placeholder="예: 예원 제2026-1호"
                  value={newAnnounceNum}
                  onChange={(e) => setNewAnnounceNum(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 font-bold focus:outline-none focus:ring-1 focus:ring-[#009b9e]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">관련 서식 다운로드 링크 (한글/PDF URL)</label>
                <input
                  type="url"
                  placeholder="예: https://yewon.ac.kr/main/filedown.php?no=46558"
                  value={newFileUrl}
                  onChange={(e) => setNewFileUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 font-bold focus:outline-none focus:ring-1 focus:ring-[#009b9e]"
                />
              </div>
            </div>

          </DialogContent>
          <DialogActions className="border-t border-slate-800/80 px-6 py-4 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setOpenCreate(false)}
              className="px-4 py-2 border border-slate-700 text-slate-300 rounded-xl text-xs font-black hover:bg-slate-800 cursor-pointer transition-all active:scale-95"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={creating}
              className="bg-[#009b9e] hover:bg-[#008082] text-white px-5 py-2 rounded-xl text-xs font-black cursor-pointer transition-all active:scale-95 shadow-md shadow-[#009b9e]/10 disabled:opacity-50"
            >
              {creating ? "제정 등록 중..." : "제정 등록 승인"}
            </button>
          </DialogActions>
        </form>
      </Dialog>

    </div>
  );
}
