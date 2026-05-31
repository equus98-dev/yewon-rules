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
import DeleteIcon from "@mui/icons-material/Delete";
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

  // 규정 영구 삭제 핸들러
  const handleDeleteRule = async (ruleId: string, title: string) => {
    if (!confirm(`[경고] "${title}" 규정을 영구적으로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며, 이 규정에 포함된 모든 조항(Articles)과 개정 이력(Revisions)이 데이터베이스에서 영구적으로 소멸됩니다.`)) return;

    try {
      const res = await fetch(`/api/admin/rules?id=${ruleId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        alert("규정이 성공적으로 영구 삭제되었습니다.");
        setRules((prev) => prev.filter((r) => r.id !== ruleId));
      } else {
        alert(`삭제 실패: ${data.error || "알 수 없는 에러"}`);
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
      <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-slate-50">
        <CircularProgress size={30} sx={{ color: "#0c3161" }} />
        <span className="text-slate-550 text-xs font-semibold">대학 규정 색인 목록 로드 중...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 text-slate-800">
      
      {/* 1. 상단 액션 툴바 */}
      <div className="bg-white border-b border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 select-none shadow-sm">
        
        {/* 검색 영역 */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="규정명, 번호, 소관부서 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 font-bold focus:outline-none focus:ring-1 focus:ring-[#0c3161] focus:border-[#0c3161]"
          />
          <SearchIcon className="absolute left-3.5 top-3 text-slate-400 text-sm" sx={{ fontSize: 16 }} />
        </div>

        {/* 신규 등록 버튼 */}
        <button
          type="button"
          onClick={() => setOpenCreate(true)}
          className="bg-[#0c3161] hover:bg-[#092244] text-white text-xs font-black px-4.5 py-2.5 rounded-xl shadow-lg shadow-[#0c3161]/10 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <AddIcon sx={{ fontSize: 16 }} />
          신규 규정 제정 등록
        </button>
      </div>

      {/* 2. 메인 규정 테이블 영역 */}
      <div className="flex-1 overflow-auto p-8 scrollbar">
        <div className="max-w-6xl mx-auto bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 select-none text-[11px]">
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
                  <td colSpan={7} className="py-24 text-center text-slate-450 font-bold bg-white">
                    검색 결과에 부합하는 대학 규정이 존재하지 않습니다.
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule, idx) => {
                  const isAbolished = rule.status === "ABOLISHED";
                  return (
                    <tr
                      key={rule.id}
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-center text-slate-400 font-bold select-none">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-black border border-blue-100 select-none shrink-0">
                            {rule.categoryName}
                          </span>
                          <span className={`text-slate-800 font-bold hover:text-blue-900 cursor-pointer transition-colors ${isAbolished ? "line-through text-slate-400" : ""}`}>
                            {rule.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-700 font-bold">{rule.ruleNumber}</td>
                      <td className="py-3 px-4 text-center select-none">
                        <span className="bg-slate-100 text-slate-650 px-2 py-0.5 rounded text-[10px] font-black border border-slate-200">
                          {rule.departmentName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500 font-bold select-none">{rule.enactmentDate}</td>
                      <td className="py-3 px-4 text-center select-none">
                        {isAbolished ? (
                          <span className="text-red-650 font-black bg-red-50 border border-red-100 px-2 py-0.5 rounded text-[9px]">
                            폐지
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-black bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-[9px]">
                            현행
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center select-none flex items-center justify-center gap-1.5">
                        
                        {/* 1) 조문 개정 (온라인 입안편집기로 진입) */}
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/editor?ruleId=${rule.id}`)}
                          className="bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-black cursor-pointer transition-all active:scale-95 flex items-center gap-1 shadow-sm"
                        >
                          <EditIcon sx={{ fontSize: 11 }} />
                          조문 개정
                        </button>
 
                        {/* 2) 폐지 / 복구 토글 */}
                        {isAbolished ? (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(rule.id, rule.status)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 text-[10px] font-black cursor-pointer transition-all active:scale-95 flex items-center gap-1 shadow-sm whitespace-nowrap"
                          >
                            <CheckCircleIcon sx={{ fontSize: 11 }} />
                            현행 복구
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(rule.id, rule.status)}
                            className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg border border-red-200 text-[10px] font-black cursor-pointer transition-all active:scale-95 flex items-center gap-1 shadow-sm whitespace-nowrap"
                          >
                            <BlockIcon sx={{ fontSize: 11 }} />
                            규정 폐지
                          </button>
                        )}
                        
                        {/* 3) 규정 삭제 */}
                        <button
                          type="button"
                          onClick={() => handleDeleteRule(rule.id, rule.title)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg border border-rose-200 text-[10px] font-black cursor-pointer transition-all active:scale-95 flex items-center gap-1 shadow-sm whitespace-nowrap"
                        >
                          <DeleteIcon sx={{ fontSize: 11 }} />
                          규정 삭제
                        </button>
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
            bgcolor: "#ffffff", 
            color: "#1e293b",
            border: "1px solid #e2e8f0", 
            borderRadius: "16px",
            boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
          },
        }}
      >
        <DialogTitle className="text-sm font-black border-b border-slate-100 text-slate-800 flex items-center gap-2">
          <AddIcon sx={{ fontSize: 18, color: "#0c3161" }} />
          신규 규정 제정 등록 (입안 기초 마스터)
        </DialogTitle>
        <form onSubmit={handleCreateRule}>
          <DialogContent className="space-y-4 pt-5 pb-6">
            
            {/* 규정명 */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-1">규정명 (필수)</label>
              <input
                type="text"
                required
                placeholder="예: 대학평의원회 운영 규정"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 font-bold focus:outline-none focus:ring-1 focus:ring-[#0c3161] focus:border-[#0c3161]"
              />
            </div>
 
            {/* 규정 분류 코드 & 규정번호 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-1">규정번호 (필수)</label>
                <input
                  type="text"
                  required
                  placeholder="예: 제2-0-5호"
                  value={newRuleNum}
                  onChange={(e) => setNewRuleNum(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 font-bold focus:outline-none focus:ring-1 focus:ring-[#0c3161] focus:border-[#0c3161]"
                />
              </div>
 
              {/* 제정 공포일 */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-1">제정일자 (필수)</label>
                <input
                  type="date"
                  required
                  value={newEnactmentDate}
                  onChange={(e) => setNewEnactmentDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#0c3161] focus:border-[#0c3161]"
                />
              </div>
            </div>
 
            {/* 분류 카테고리 & 소관 부서 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 flex flex-col">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 pl-1">분류 카테고리 (필수)</label>
                <select
                  required
                  value={newCatId}
                  onChange={(e) => setNewCatId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#0c3161] focus:border-[#0c3161] cursor-pointer"
                >
                  <option value="" disabled>카테고리 선택</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="text-slate-850">{cat.name}</option>
                  ))}
                </select>
              </div>
 
              <div className="space-y-1 flex flex-col">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 pl-1">소관 부서 (필수)</label>
                <select
                  required
                  value={newDeptId}
                  onChange={(e) => setNewDeptId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#0c3161] focus:border-[#0c3161] cursor-pointer"
                >
                  <option value="" disabled>부서 선택</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id} className="text-slate-850">{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
 
            {/* 공포번호 & 원본 다운로드 한글/PDF URL */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-1">공포 기호/번호</label>
                <input
                  type="text"
                  placeholder="예: 예원 제2026-1호"
                  value={newAnnounceNum}
                  onChange={(e) => setNewAnnounceNum(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 font-bold focus:outline-none focus:ring-1 focus:ring-[#0c3161] focus:border-[#0c3161]"
                />
              </div>
 
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-1">관련 서식 다운로드 링크 (한글/PDF URL)</label>
                <input
                  type="url"
                  placeholder="예: https://yewon.ac.kr/main/filedown.php?no=46558"
                  value={newFileUrl}
                  onChange={(e) => setNewFileUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 font-bold focus:outline-none focus:ring-1 focus:ring-[#0c3161] focus:border-[#0c3161]"
                />
              </div>
            </div>
 
          </DialogContent>
          <DialogActions className="border-t border-slate-100 px-6 py-4 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setOpenCreate(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-50 cursor-pointer transition-all active:scale-95"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={creating}
              className="bg-[#0c3161] hover:bg-[#092244] text-white px-5 py-2 rounded-xl text-xs font-black cursor-pointer transition-all active:scale-95 shadow-md shadow-[#0c3161]/10 disabled:opacity-50"
            >
              {creating ? "제정 등록 중..." : "제정 등록 승인"}
            </button>
          </DialogActions>
        </form>
      </Dialog>
 
    </div>
  );
}
