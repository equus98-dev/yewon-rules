"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import BusinessIcon from "@mui/icons-material/Business";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import { useRouter as useNextRouter } from "next/navigation";

// 선택 불가 그룹 부서명 (구분자 역할만 함)
const GROUP_DEPT_NAMES = new Set(["총장직속", "부설기관", "부속기관"]);

// 부서 셀렉트 렌더링용 헬퍼 - optgroup 구조로 출력
function DeptSelectOptions({ departments }: { departments: any[] }) {
  // 선택 가능한 부서만 필터
  const selectable = departments.filter((d) => !GROUP_DEPT_NAMES.has(d.name));

  // 그룹별 분류
  const 총장직속하위 = selectable.filter((d) => ["비서실", "감사실", "인권센터"].includes(d.name));
  const 부설기관하위 = selectable.filter((d) => ["평생교육원"].includes(d.name));
  const 부속기관하위 = selectable.filter((d) => ["학생생활관", "정보도서관"].includes(d.name));
  const 독립부서 = selectable.filter((d) =>
    ![...총장직속하위, ...부설기관하위, ...부속기관하위].some((x) => x.id === d.id)
  );

  return (
    <>
      <option value="" disabled>부서 선택</option>
      <optgroup label="◆ 총장직속">
        {총장직속하위.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </optgroup>
      {독립부서.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      <optgroup label="◆ 부설기관">
        {부설기관하위.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </optgroup>
      <optgroup label="◆ 부속기관">
        {부속기관하위.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </optgroup>
    </>
  );
}

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

  // 인라인 담당부서 편집 상태
  const [editingDeptRuleId, setEditingDeptRuleId] = useState<string | null>(null);
  const [editingDeptValue, setEditingDeptValue] = useState<string>("");
  const [savingDept, setSavingDept] = useState(false);

  // 개정 이력 관리(롤백) 모달 상태
  const [openHistory, setOpenHistory] = useState(false);
  const [historyRuleId, setHistoryRuleId] = useState("");
  const [historyRuleTitle, setHistoryRuleTitle] = useState("");
  const [historyRevisions, setHistoryRevisions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // 데이터 로드
  useEffect(() => {
    async function loadData() {
      try {
        const [rulesRes, catsRes, deptsRes] = await Promise.all([
          fetch("/api/admin/rules"),
          fetch("/api/categories?type=field"),
          fetch("/api/categories?type=dept"),
        ]);

        const rulesData = (await rulesRes.json()) as any;
        setRules(rulesData);

        // 카테고리 트리에서 1뎁스/2뎁스 리스트 평탄화
        const catsData = (await catsRes.json()) as any;
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

        // 부서 목록 가공 (dept- 접두어 제거, 그룹 부서 포함하여 저장)
        const deptsData = (await deptsRes.json()) as any;
        const flatDepts: any[] = [];
        function flattenDepts(nodes: any[]) {
          nodes.forEach((n) => {
            if (n.type === "folder") {
              flatDepts.push({
                id: n.id.replace("dept-", ""),
                name: n.name,
              });
              // 하위 부서 폴더도 수집
              if (Array.isArray(n.children)) {
                n.children.filter((c: any) => c.type === "folder").forEach((sub: any) => {
                  flatDepts.push({
                    id: sub.id.replace("dept-", ""),
                    name: sub.name,
                  });
                });
              }
            }
          });
        }
        flattenDepts(deptsData);
        setDepartments(flatDepts);
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
      const data = (await res.json()) as any;
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

  // 연혁 관리 모달 열기
  const handleOpenHistory = async (ruleId: string, title: string) => {
    setHistoryRuleId(ruleId);
    setHistoryRuleTitle(title);
    setHistoryRevisions([]);
    setOpenHistory(true);
    setLoadingHistory(true);
    
    try {
      const res = await fetch(`/api/rules/${ruleId}`);
      if (!res.ok) throw new Error("Failed to fetch rule info");
      const data = (await res.json()) as any;
      setHistoryRevisions(data.revisions || []);
    } catch (e) {
      console.error(e);
      alert("연혁을 불러오지 못했습니다.");
      setOpenHistory(false);
    } finally {
      setLoadingHistory(false);
    }
  };

  // 최신 개정 취소 (롤백)
  const handleDeleteRevision = async (revisionId: string, versionName: string) => {
    if (!confirm(`[경고] 가장 최근 개정된 "${versionName}" 내역을 완전히 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며, 연관된 모든 조문 및 부칙 데이터가 삭제됩니다.`)) return;

    try {
      const res = await fetch(`/api/admin/revisions/${revisionId}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as any;
      if (res.ok) {
        alert("개정 내역이 성공적으로 취소되었습니다.");
        setOpenHistory(false);
      } else {
        alert(`취소 실패: ${data.error || "알 수 없는 에러"}`);
      }
    } catch (e) {
      console.error(e);
      alert("네트워크 오류 발생");
    }
  };

  // 담당부서 인라인 편집 시작
  const handleStartEditDept = (ruleId: string, currentDeptId: string) => {
    setEditingDeptRuleId(ruleId);
    setEditingDeptValue(currentDeptId);
  };

  // 담당부서 인라인 편집 취소
  const handleCancelEditDept = () => {
    setEditingDeptRuleId(null);
    setEditingDeptValue("");
  };

  // 담당부서 저장
  const handleSaveDept = async (ruleId: string) => {
    if (!editingDeptValue) {
      alert("부서를 선택하십시오.");
      return;
    }
    setSavingDept(true);
    try {
      const res = await fetch(`/api/admin/rules?id=${ruleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentId: editingDeptValue }),
      });
      if (res.ok) {
        const selectedDept = departments.find((d) => d.id === editingDeptValue);
        setRules((prev) =>
          prev.map((r) =>
            r.id === ruleId
              ? { ...r, departmentId: editingDeptValue, departmentName: selectedDept?.name || r.departmentName }
              : r
          )
        );
        setEditingDeptRuleId(null);
        setEditingDeptValue("");
      } else {
        const data = (await res.json()) as any;
        alert(`담당부서 변경 실패: ${data.error || "알 수 없는 에러"}`);
      }
    } catch (e) {
      console.error(e);
      alert("네트워크 오류 발생");
    } finally {
      setSavingDept(false);
    }
  };

  // 신규 규정(제정) 등록 버튼
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

      const data = (await res.json()) as any;
      if (res.ok) {
        alert("규정 제정 등록이 완료되었습니다!\n조문 편집 에디터로 이동합니다.");
        router.push(`/admin/editor?ruleId=${data.ruleId}&mode=new`);
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
        <span className="text-slate-550 text-sm font-semibold">대학 규정 색인 목록 로드 중...</span>
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
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-2.5 text-sm text-slate-800 placeholder-slate-400 font-bold focus:outline-none focus:ring-1 focus:ring-[#0c3161] focus:border-[#0c3161]"
          />
          <SearchIcon className="absolute left-3.5 top-3 text-slate-400 text-sm" sx={{ fontSize: 16 }} />
        </div>

        <div className="flex items-center gap-3">
          {/* 전체 시스템 DB 조항 일괄 정상화 버튼 */}
          <button
            type="button"
            onClick={async () => {
              if (!confirm("시스템 내의 '모든 규정'을 스캔하여 간격 및 중복 제목 오류를 자동으로 찾아 DB를 정화합니다.\n\n이 작업은 되돌릴 수 없으며 시간이 조금 걸릴 수 있습니다.\n계속하시겠습니까?")) return;
              
              try {
                const res = await fetch("/api/admin/fix-all-formats", { method: "POST" });
                const data = (await res.json()) as any;
                if (res.ok) {
                  alert(`✅ 전체 규정 DB 스캔 및 정화 완료!\n총 ${data.count}개의 비정상 조항이 정상화되었습니다.`);
                  window.location.reload();
                } else {
                  alert("오류 발생: " + data.error);
                }
              } catch (e) {
                alert("네트워크/서버 오류가 발생했습니다.");
              }
            }}
            className="bg-white border border-[#0c3161] hover:bg-slate-50 text-[#0c3161] text-sm font-black px-4.5 py-2.5 rounded-xl shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="모든 규정의 오류를 일괄 수정합니다."
          >
            <AutoFixHighIcon sx={{ fontSize: 16 }} />
            전체 규정 일괄 정화
          </button>

          {/* 신규 등록 버튼 */}
          <button
            type="button"
            onClick={() => setOpenCreate(true)}
            className="bg-[#0c3161] hover:bg-[#092244] text-white text-sm font-black px-4.5 py-2.5 rounded-xl shadow-lg shadow-[#0c3161]/10 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <AddIcon sx={{ fontSize: 16 }} />
            신규 규정 제정 등록
          </button>
        </div>
      </div>

      {/* 2. 메인 규정 테이블 영역 */}
      <div className="flex-1 overflow-auto p-8 scrollbar">
        <div className="w-full bg-white border-t-2 border-[#007073] shadow-sm overflow-hidden flex flex-col">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-[#007073] text-white select-none text-[15px]">
                <th className="py-4 px-4 font-black w-14 text-center border-r border-[#009b9e]/40">번호</th>
                <th className="py-4 px-4 font-black text-center">규정명 / 분류</th>
                <th className="py-4 px-4 font-black w-24 text-center border-l border-[#009b9e]/40">규정번호</th>
                <th className="py-4 px-4 font-black w-40 text-center border-l border-[#009b9e]/40">
                  <div className="flex items-center justify-center gap-1">
                    <BusinessIcon sx={{ fontSize: 14 }} />
                    소관부서
                  </div>
                </th>
                <th className="py-4 px-4 font-black w-32 text-center border-l border-[#009b9e]/40">제·개정일</th>
                <th className="py-4 px-4 font-black w-20 text-center border-l border-[#009b9e]/40">상태</th>
                <th className="py-4 px-4 font-black w-64 text-center border-l border-[#009b9e]/40">작업</th>
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
                  const isEditingThisRow = editingDeptRuleId === rule.id;

                  return (
                    <tr
                      key={rule.id}
                      className={`border-b border-slate-200 hover:bg-slate-50 transition-colors group ${isEditingThisRow ? "bg-blue-50/30" : ""}`}
                    >
                      <td className="py-4 px-4 text-center text-slate-500 font-extrabold text-[16px] select-none">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-xs font-black border border-blue-100 select-none shrink-0">
                            {rule.categoryName}
                          </span>
                          <span className={`text-slate-800 font-bold hover:text-blue-900 cursor-pointer transition-colors ${isAbolished ? "line-through text-slate-400" : ""}`}>
                            {rule.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-700 font-bold">{rule.ruleNumber}</td>

                      {/* 소관부서 셀 - 인라인 편집 */}
                      <td className="py-3 px-4 text-center select-none">
                        {isEditingThisRow ? (
                          <div className="flex items-center gap-1 justify-center">
                            <select
                              autoFocus
                              value={editingDeptValue}
                              onChange={(e) => setEditingDeptValue(e.target.value)}
                              className="bg-white border border-blue-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer max-w-[150px]"
                              disabled={savingDept}
                            >
                              <DeptSelectOptions departments={departments} />
                            </select>
                            <button
                              type="button"
                              onClick={() => handleSaveDept(rule.id)}
                              disabled={savingDept}
                              className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                              title="저장"
                            >
                              {savingDept ? <CircularProgress size={10} sx={{ color: "white" }} /> : <CheckIcon sx={{ fontSize: 12 }} />}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEditDept}
                              disabled={savingDept}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-600 p-1 rounded cursor-pointer transition-all active:scale-95"
                              title="취소"
                            >
                              <CloseIcon sx={{ fontSize: 12 }} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartEditDept(rule.id, rule.departmentId)}
                            className="group flex items-center gap-1 justify-center mx-auto bg-slate-100 hover:bg-blue-50 text-slate-650 hover:text-blue-700 px-2 py-0.5 rounded border border-slate-200 hover:border-blue-200 text-sm font-black cursor-pointer transition-all active:scale-95"
                            title="클릭하여 담당부서 변경"
                          >
                            <span>{rule.departmentName}</span>
                            <EditIcon sx={{ fontSize: 10 }} className="text-slate-400 group-hover:text-blue-400 transition-colors shrink-0" />
                          </button>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center text-slate-500 font-bold select-none whitespace-nowrap">{rule.enactmentDate}</td>
                      <td className="py-3 px-4 text-center select-none">
                        {isAbolished ? (
                          <span className="text-red-650 font-black bg-red-50 border border-red-100 px-2 py-0.5 rounded text-xs">
                            폐지
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-black bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-xs">
                            현행
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center select-none flex items-center justify-center gap-1.5">

                        {/* 1) 조문 개정 (온라인 입안편집기로 진입) */}
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/editor?ruleId=${rule.id}`)}
                          className="bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 text-[13px] font-black cursor-pointer transition-all active:scale-95 flex items-center gap-1 shadow-sm whitespace-nowrap"
                        >
                          <EditIcon sx={{ fontSize: 13 }} />
                          조문 개정
                        </button>

                        {/* 2) 폐지 / 복구 토글 */}
                        {isAbolished ? (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(rule.id, rule.status)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 text-[13px] font-black cursor-pointer transition-all active:scale-95 flex items-center gap-1 shadow-sm whitespace-nowrap"
                          >
                            <CheckCircleIcon sx={{ fontSize: 13 }} />
                            현행 복구
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(rule.id, rule.status)}
                            className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg border border-red-200 text-[13px] font-black cursor-pointer transition-all active:scale-95 flex items-center gap-1 shadow-sm whitespace-nowrap"
                          >
                            <BlockIcon sx={{ fontSize: 13 }} />
                            규정 폐지
                          </button>
                        )}

                        {/* 연혁 관리 */}
                        <button
                          type="button"
                          onClick={() => handleOpenHistory(rule.id, rule.title)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-200 text-[13px] font-black cursor-pointer transition-all active:scale-95 flex items-center gap-1 shadow-sm whitespace-nowrap"
                        >
                          <AutoFixHighIcon sx={{ fontSize: 13 }} />
                          연혁 관리
                        </button>

                        {/* 3) 규정 삭제 */}
                        <button
                          type="button"
                          onClick={() => handleDeleteRule(rule.id, rule.title)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg border border-rose-200 text-[13px] font-black cursor-pointer transition-all active:scale-95 flex items-center gap-1 shadow-sm whitespace-nowrap"
                        >
                          <DeleteIcon sx={{ fontSize: 13 }} />
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
          신규 규정 제정 등록 (신설)
        </DialogTitle>
        <form onSubmit={handleCreateRule}>
          <DialogContent className="space-y-4 pt-5 pb-6">

            {/* 신설규정 안내 배너 */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <span className="text-blue-500 text-lg shrink-0 mt-0.5">📋</span>
              <div className="text-xs text-blue-800 font-bold leading-relaxed">
                <strong className="block mb-0.5 text-blue-900">신설규정 등록 안내</strong>
                기본 정보(규정명·번호·분류·소관부서·제정일)를 입력하고 등록하면, 자동으로 <strong>조문 편집 에디터</strong>로 이동합니다.<br />
                에디터에서 조문(條文) 내용을 직접 작성·저장하면 신설규정 입력이 완료됩니다.
              </div>
            </div>

            {/* 규정명 */}
            <div className="space-y-1">
              <label className="text-sm text-slate-500 font-bold uppercase tracking-wider pl-1">규정명 (필수)</label>
              <input
                type="text"
                required
                placeholder="예: 대학평의원회 운영 규정"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 font-bold focus:outline-none focus:ring-1 focus:ring-[#0c3161] focus:border-[#0c3161]"
              />
            </div>

            {/* 규정번호 & 제정일자 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-slate-500 font-bold uppercase tracking-wider pl-1">규정번호 (필수)</label>
                <input
                  type="text"
                  required
                  placeholder="예: 제2-0-5호"
                  value={newRuleNum}
                  onChange={(e) => setNewRuleNum(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 font-bold focus:outline-none focus:ring-1 focus:ring-[#0c3161] focus:border-[#0c3161]"
                />
              </div>

              {/* 제정 공포일 */}
              <div className="space-y-1">
                <label className="text-sm text-slate-500 font-bold uppercase tracking-wider pl-1">제정일자 (필수)</label>
                <input
                  type="date"
                  required
                  value={newEnactmentDate}
                  onChange={(e) => setNewEnactmentDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#0c3161] focus:border-[#0c3161]"
                />
              </div>
            </div>

            {/* 분류 카테고리 & 소관 부서 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 flex flex-col">
                <label className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1 pl-1">분류 카테고리 (필수)</label>
                <select
                  required
                  value={newCatId}
                  onChange={(e) => setNewCatId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#0c3161] focus:border-[#0c3161] cursor-pointer"
                >
                  <option value="" disabled>카테고리 선택</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="text-slate-850">{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 flex flex-col">
                <label className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1 pl-1">소관 부서 (필수)</label>
                <select
                  required
                  value={newDeptId}
                  onChange={(e) => setNewDeptId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#0c3161] focus:border-[#0c3161] cursor-pointer"
                >
                  <DeptSelectOptions departments={departments} />
                </select>
              </div>
            </div>

            {/* 공포번호 & 다운로드 URL */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-slate-500 font-bold uppercase tracking-wider pl-1">공포 기호/번호</label>
                <input
                  type="text"
                  placeholder="예: 예원 제2026-1호"
                  value={newAnnounceNum}
                  onChange={(e) => setNewAnnounceNum(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 font-bold focus:outline-none focus:ring-1 focus:ring-[#0c3161] focus:border-[#0c3161]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-slate-500 font-bold uppercase tracking-wider pl-1">관련 서식 다운로드 링크 (한글/PDF URL)</label>
                <input
                  type="url"
                  placeholder="예: https://yewon.ac.kr/main/filedown.php?no=46558"
                  value={newFileUrl}
                  onChange={(e) => setNewFileUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 font-bold focus:outline-none focus:ring-1 focus:ring-[#0c3161] focus:border-[#0c3161]"
                />
              </div>
            </div>

          </DialogContent>
          <DialogActions className="border-t border-slate-100 px-6 py-4 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setOpenCreate(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-black hover:bg-slate-50 cursor-pointer transition-all active:scale-95"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={creating}
              className="bg-[#0c3161] hover:bg-[#092244] text-white px-5 py-2 rounded-xl text-sm font-black cursor-pointer transition-all active:scale-95 shadow-md shadow-[#0c3161]/10 disabled:opacity-50 flex items-center gap-1.5"
            >
              <AddIcon sx={{ fontSize: 15 }} />
              {creating ? "등록 중..." : "제정 등록 후 편집 시작"}
            </button>
          </DialogActions>
        </form>
      </Dialog>

      {/* 4. 연혁 관리 모달 */}
      <Dialog
        open={openHistory}
        onClose={() => setOpenHistory(false)}
        maxWidth="md"
        fullWidth
        sx={{ borderRadius: "12px", padding: "10px" }}
      >
        <DialogTitle className="font-black text-[#000080] border-b border-slate-200 pb-4 mb-4 flex justify-between items-center text-lg">
          [{historyRuleTitle}] 개정 이력 관리
          <IconButton onClick={() => setOpenHistory(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent className="text-[15px] leading-relaxed pb-6 min-h-[300px]">
          {loadingHistory ? (
            <div className="flex justify-center items-center h-40">
              <CircularProgress />
            </div>
          ) : historyRevisions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-700 border-collapse">
                <thead className="bg-slate-50 border-b border-slate-300">
                  <tr>
                    <th className="py-3 px-4 font-bold whitespace-nowrap text-center">버전</th>
                    <th className="py-3 px-4 font-bold whitespace-nowrap text-center">개정구분</th>
                    <th className="py-3 px-4 font-bold whitespace-nowrap text-center">버전명</th>
                    <th className="py-3 px-4 font-bold whitespace-nowrap text-center">공포일</th>
                    <th className="py-3 px-4 font-bold whitespace-nowrap text-center">시행일</th>
                    <th className="py-3 px-4 font-bold whitespace-nowrap text-center">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {historyRevisions.map((rev, idx) => (
                    <tr key={rev.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-center font-medium">v{rev.version}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded text-[11px] font-bold ${
                          rev.revisionType === 'ENACTMENT' ? 'bg-sky-100 text-sky-700' :
                          rev.revisionType === 'FULL_REVISION' ? 'bg-red-100 text-red-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {rev.revisionType === 'ENACTMENT' ? '제정' :
                           rev.revisionType === 'FULL_REVISION' ? '전부개정' : '일부개정'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold">{rev.versionName}</td>
                      <td className="py-3 px-4 text-center text-slate-500">
                        {rev.enactmentDate ? new Date(rev.enactmentDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500">
                        {rev.effectiveDate ? new Date(rev.effectiveDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-4 text-center flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => window.open(`/revision/${historyRuleId}?admin=true&revId=${rev.id}`, '_blank', 'width=720,height=780,scrollbars=yes,resizable=yes')}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1.5 rounded border border-indigo-200 text-xs font-bold transition-colors whitespace-nowrap shadow-sm cursor-pointer"
                        >
                          📋 개정정보 관리
                        </button>
                        {idx === 0 && rev.version > 1 ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteRevision(rev.id, rev.versionName)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1.5 rounded border border-red-200 text-xs font-bold transition-colors whitespace-nowrap shadow-sm cursor-pointer"
                          >
                            <DeleteIcon sx={{ fontSize: 14, mr: 0.5 }} />최신 롤백(삭제)
                          </button>
                        ) : idx === 0 && rev.version === 1 ? (
                           <span className="text-xs text-slate-400 px-2 py-1">제정 삭제 불가</span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 p-4 bg-amber-50 text-amber-800 rounded-lg text-sm border border-amber-200">
                <strong className="block mb-1">⚠️ 주의사항</strong>
                연혁의 무결성을 보장하기 위해 <strong>가장 최신의 개정 내역</strong>만 취소(삭제)할 수 있습니다. 취소 시 해당 버전에 포함된 조항 및 부칙 데이터가 영구 삭제되며, 시스템은 자동으로 이전 버전을 현행 규정으로 복구합니다.
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              조회된 개정 이력이 없습니다.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
