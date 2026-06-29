"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import InfoIcon from "@mui/icons-material/Info";
import { CircularProgress } from "@mui/material";

export default function RevisionClient({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const queryAdmin = searchParams.get("admin") === "true";
  const queryRevId = searchParams.get("revId");

  const [loading, setLoading] = useState(true);
  const [ruleData, setRuleData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [historySelectedRevId, setHistorySelectedRevId] = useState<string>("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDescText, setEditDescText] = useState("");
  const [editEnactDate, setEditEnactDate] = useState("");
  const [editEffDate, setEditEffDate] = useState("");
  const [isSavingDesc, setIsSavingDesc] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isCreatingRev, setIsCreatingRev] = useState(false);
  const [newRevType, setNewRevType] = useState("AMENDMENT");
  const [newRevDate, setNewRevDate] = useState("");
  const [newRevDesc, setNewRevDesc] = useState("");
  const [isSubmittingRev, setIsSubmittingRev] = useState(false);

  const handleCreateRevision = async () => {
    if (!newRevDate) {
      alert("개정일자를 입력해주세요.");
      return;
    }
    setIsSubmittingRev(true);
    try {
      const payload = {
        ruleId: id,
        versionName: newRevType === 'AMENDMENT' ? '일부개정본' : newRevType === 'TOTAL_AMENDMENT' ? '전부개정본' : '제정본',
        revisionType: newRevType,
        enactmentDate: newRevDate,
        effectiveDate: newRevDate,
        description: newRevDesc || `${newRevDate} 개정 사항 반영`,
        articles: []
      };
      const res = await fetch("/api/admin/revisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as any;
        throw new Error(errorData.error || "연혁 생성 실패");
      }
      alert("새로운 연혁이 성공적으로 추가되었습니다.");
      setIsCreatingRev(false);
      setNewRevDate("");
      setNewRevDesc("");
      
      const ruleRes = await fetch(`/api/rules/${id}`);
      if (ruleRes.ok) {
        const newRuleData = (await ruleRes.json()) as any;
        setRuleData(newRuleData);
      }
      if (window.opener) {
        window.opener.dispatchEvent(new CustomEvent('rule-updated'));
      }
    } catch (error: any) {
      alert(error.message || "연혁 생성 중 오류가 발생했습니다.");
    } finally {
      setIsSubmittingRev(false);
    }
  };

  const handleDeleteRevision = async () => {
    if (!selectedRev) return;
    if (revisions.length <= 1) {
      alert("최초 제정본(유일한 연혁)은 삭제할 수 없습니다.");
      return;
    }
    if (selectedRev.id !== revisions[0].id) {
      alert("안전을 위해 가장 최신 개정 연혁만 삭제(취소)할 수 있습니다.");
      return;
    }
    if (!confirm(`정말 '${selectedRev.versionName || "해당 연혁"}'을(를) 삭제하시겠습니까?\n해당 연혁에 속한 조문과 비교 내역이 모두 삭제됩니다.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/revisions/${selectedRev.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as any;
        throw new Error(err.error || "연혁 삭제 실패");
      }
      alert("연혁이 성공적으로 삭제되었습니다.");
      
      const ruleRes = await fetch(`/api/rules/${id}`);
      if (ruleRes.ok) {
        const newRuleData = (await ruleRes.json()) as any;
        setRuleData(newRuleData);
        if (newRuleData.revisions?.length > 0) {
          setHistorySelectedRevId(newRuleData.revisions[0].id);
        }
      }
      if (window.opener) {
        window.opener.dispatchEvent(new CustomEvent('rule-updated'));
      }
    } catch (e: any) {
      alert(e.message || "연혁 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !selectedRev) return;

    const file = files[0];
    const valid = file.name.toLowerCase().endsWith(".hwp") || file.name.toLowerCase().endsWith(".pdf");
    if (!valid) {
      alert("HWP 또는 PDF 파일만 업로드할 수 있습니다.");
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const originalName = file.name;
      let cleanName = originalName;
      let newFileName = cleanName;
      
      const bracketMatch = cleanName.match(/^\[([^\]]+)\]\s*(.*)$/);
      if (bracketMatch) {
        const bracketText = bracketMatch[1];
        const restName = bracketMatch[2];
        if (bracketText.includes("전문") || bracketText.includes('별지') || bracketText.includes('별표') || bracketText.includes('별첨') || bracketText.includes('서식')) {
          newFileName = cleanName;
        } else {
          newFileName = `[전문] ${restName}`;
        }
      } else {
        newFileName = `[전문] ${cleanName}`;
      }

      const modifiedFile = new File([file], newFileName, { type: file.type });
      const formData = new FormData();
      formData.append("file", modifiedFile);
      formData.append("ruleId", id);
      formData.append("revisionId", selectedRev.id);

      const res = await fetch("/api/admin/files", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert("원문파일이 성공적으로 업로드되었습니다.");
        const ruleRes = await fetch(`/api/rules/${id}`);
        if (ruleRes.ok) {
          const newRuleData = (await ruleRes.json()) as any;
          setRuleData(newRuleData);
        }
        if (window.opener) {
          window.opener.dispatchEvent(new CustomEvent('rule-updated'));
        }
      } else {
        const errorData = (await res.json()) as any;
        alert(`업로드 실패: ${errorData.error || '알 수 없는 오류'}`);
      }
    } catch (err) {
      console.error("File upload error:", err);
      alert("파일 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm("이 원문파일을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/admin/files?id=${attachmentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("삭제 실패");
      alert("삭제되었습니다.");
      const ruleRes = await fetch(`/api/rules/${id}`);
      if (ruleRes.ok) {
        const newRuleData = (await ruleRes.json()) as any;
        setRuleData(newRuleData);
      }
      if (window.opener) {
        window.opener.dispatchEvent(new CustomEvent('rule-updated'));
      }
    } catch (error: any) {
      alert(error.message || "삭제 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    // 관리자 여부 확인
    const token = localStorage.getItem("admin_token") || localStorage.getItem("token") || localStorage.getItem("admin");
    const hasAdminCookie = typeof document !== 'undefined' && (document.cookie.includes("admin") || document.cookie.includes("token"));
    if (token || hasAdminCookie || queryAdmin) {
      setIsAdmin(true);
    }

    async function fetchRule() {
      try {
        const res = await fetch(`/api/rules/${id}`);
        if (!res.ok) throw new Error("규정을 불러오는데 실패했습니다.");
        const data = (await res.json()) as any;
        setRuleData(data);

        // 최신 연혁이 위로 오도록 정렬 (공포일/버전 내림차순)
        const sortedRevisions = [...(data.revisions || [])].sort((a: any, b: any) => {
          const dateA = new Date(a.enactmentDate || 0).getTime();
          const dateB = new Date(b.enactmentDate || 0).getTime();
          if (dateB !== dateA) return dateB - dateA;
          return (b.version || 0) - (a.version || 0);
        });

        if (sortedRevisions.length > 0) {
          if (queryRevId && sortedRevisions.some((r: any) => r.id === queryRevId)) {
            setHistorySelectedRevId(queryRevId);
          } else {
            setHistorySelectedRevId(sortedRevisions[0].id);
          }
        }
      } catch (err) {
        console.error("Rule fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRule();
  }, [id, queryAdmin, queryRevId]);

  if (loading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-slate-50">
        <CircularProgress />
        <p className="mt-4 text-sm text-slate-500 font-medium">개정정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!ruleData) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <p className="text-slate-600 font-bold text-base mb-2">규정 정보를 찾을 수 없습니다.</p>
        <button 
          onClick={() => window.close()} 
          className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-colors cursor-pointer text-sm"
        >
          창 닫기
        </button>
      </div>
    );
  }

  // 최신 연혁이 위로 오도록 정렬
  const revisions = [...(ruleData.revisions || [])].sort((a: any, b: any) => {
    const dateA = new Date(a.enactmentDate || 0).getTime();
    const dateB = new Date(b.enactmentDate || 0).getTime();
    if (dateB !== dateA) return dateB - dateA;
    return (b.version || 0) - (a.version || 0);
  });

  const selectedRev = revisions.find((r: any) => r.id === historySelectedRevId) || revisions[0];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case "ENACTMENT": return "제정";
      case "AMENDMENT": return "일부개정";
      case "TOTAL_AMENDMENT": return "전부개정";
      case "FULL_REVISION": return "전부개정";
      case "ABOLITION": return "폐지";
      default: return type || "개정";
    }
  };

  const handleSaveDescription = async () => {
    if (!selectedRev) return;
    setIsSavingDesc(true);
    try {
      const payload = {
        description: editDescText,
        enactmentDate: editEnactDate || undefined,
        effectiveDate: editEffDate || undefined,
      };
      const res = await fetch(`/api/admin/revisions/${selectedRev.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        selectedRev.description = editDescText;
        if (editEnactDate) selectedRev.enactmentDate = new Date(editEnactDate).toISOString();
        if (editEffDate) selectedRev.effectiveDate = new Date(editEffDate).toISOString();
        setIsEditingDesc(false);
        alert("개정정보가 성공적으로 저장되었습니다.");
        
        const ruleRes = await fetch(`/api/rules/${id}`);
        if (ruleRes.ok) {
          const newRuleData = (await ruleRes.json()) as any;
          setRuleData(newRuleData);
        }
        if (window.opener) {
          window.opener.dispatchEvent(new CustomEvent('rule-updated'));
        }
      } else {
        alert("저장에 실패했습니다.");
      }
    } catch (e) {
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSavingDesc(false);
    }
  };

  // 원문파일 필터링 (선택한 연혁에 매칭되는 파일만 표시, revisionId가 없으면 최신 개정에 매칭)
  // 별표, 별지, 서식, 별첨, 첨부 등을 철저히 제외하고 본문/전문 파일만 표시
  const allAttachments = ruleData.attachments || [];
  const currentRevId = selectedRev?.id;
  const isLatestRev = selectedRev?.id === revisions[0]?.id;
  const mainAttachments = allAttachments.filter((att: any) => {
    const matchRevision = att.revisionId ? att.revisionId === currentRevId : isLatestRev;
    const title = att.title || "";
    return matchRevision && !title.includes("별표") && !title.includes("별지") && !title.includes("서식") && !title.includes("별첨") && !title.includes("첨부");
  });

  return (
    <div className="w-screen h-screen flex flex-col bg-white select-none overflow-y-auto">
      {/* 관리자 모드 안내 바 */}
      {isAdmin && (
        <div className="bg-amber-50 px-5 py-2.5 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
            <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded text-[10px]">ADMIN</span>
            <span>관리자 모드: 개정내용 직접 편집 및 파일 연계 통제 가능</span>
          </div>
          <button
            onClick={() => window.open('/admin/files', '_blank')}
            className="text-[11px] font-bold bg-amber-600 text-white px-2.5 py-1 rounded hover:bg-amber-700 transition-colors cursor-pointer shadow-sm"
          >
            📁 전문 파일 업로드 관리
          </button>
        </div>
      )}

      {/* 헤더 */}
      <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2a5298] px-5 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shadow-inner">
            <InfoIcon sx={{ fontSize: 18 }} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-black text-[16px] tracking-tight">개정정보</h1>
            <p className="text-blue-200 text-[11px] font-medium mt-0.5">예원예술대학교 규정관리시스템</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              const printWin = window.open("", "_blank", "width=700,height=600");
              if (!printWin || !selectedRev) return;
              const typeLabel = getTypeLabel(selectedRev.revisionType);
              const enactDate = formatDate(selectedRev.enactmentDate);
              const effectDate = formatDate(selectedRev.effectiveDate);
              const dateLabel = selectedRev.revisionType === 'ENACTMENT' ? '제정일' : '개정일';
              printWin.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>개정정보 - ${ruleData?.title || ""}</title>
                <style>
                  body { font-family: 'Malgun Gothic', sans-serif; padding: 30px; color: #333; }
                  h1 { font-size: 18px; color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 10px; }
                  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                  th { background: #f0f4f8; text-align: left; padding: 10px 14px; border: 1px solid #d1d5db; width: 30%; font-size: 13px; }
                  td { padding: 10px 14px; border: 1px solid #d1d5db; font-size: 13px; }
                  .footer { margin-top: 30px; text-align: center; color: #999; font-size: 11px; }
                  @media print { body { padding: 20px; } }
                </style></head><body>
                <h1>개정정보</h1>
                <table>
                  <tr><th>제목</th><td>${ruleData?.ruleNumber || ""} ${ruleData?.title || ""}</td></tr>
                  <tr><th>제개정유형</th><td>${typeLabel}</td></tr>
                  <tr><th>${dateLabel}</th><td>${enactDate}</td></tr>
                  <tr><th>시행일</th><td>${effectDate}</td></tr>
                  ${selectedRev.description ? `<tr><th>개정내용</th><td>${selectedRev.description.replace(/\n/g, '<br/>')}</td></tr>` : ""}
                </table>
                <div class="footer">예원예술대학교 규정관리시스템</div>
                </body></html>`);
              printWin.document.close();
              setTimeout(() => printWin.print(), 300);
            }}
            className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer shadow-sm"
            title="인쇄"
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          </button>
          <button 
            onClick={() => window.close()} 
            className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer shadow-sm"
            title="창 닫기"
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 p-5 overflow-y-auto">
        <table className="w-full border-collapse text-[15px] shadow-sm rounded-lg overflow-hidden border border-slate-200">
          <colgroup>
            <col style={{ width: '28%' }} />
            <col style={{ width: '72%' }} />
          </colgroup>
          <tbody>
            {/* 연혁 선택 */}
            <tr>
              <th className="bg-slate-50 text-left px-4 py-4 border-b border-slate-200 font-bold text-slate-700 align-middle">
                연혁 선택
                {isAdmin && (
                  <div className="inline-flex items-center gap-1 ml-2">
                    <button
                      onClick={() => setIsCreatingRev(true)}
                      className="text-[12px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer font-bold shadow-sm inline-flex items-center gap-1"
                      title="새로운 연혁(과거 개정 이력) 추가"
                    >
                      ➕ 연혁 추가
                    </button>
                    {revisions.length > 1 && selectedRev?.id === revisions[0]?.id && (
                      <button
                        onClick={handleDeleteRevision}
                        className="text-[12px] bg-red-50 text-red-600 px-2.5 py-1 rounded border border-red-200 hover:bg-red-100 transition-colors cursor-pointer font-bold shadow-sm inline-flex items-center gap-1"
                        title="최신 연혁 삭제 (개정 취소)"
                      >
                        🗑️ 연혁 삭제
                      </button>
                    )}
                  </div>
                )}
              </th>
              <td className="px-4 py-4 border-b border-slate-200 bg-white">
                <select 
                  value={historySelectedRevId}
                  onChange={(e) => { setHistorySelectedRevId(e.target.value); setIsEditingDesc(false); }}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-[15px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer font-medium shadow-sm"
                >
                  {revisions.map((rev: any) => (
                    <option key={rev.id} value={rev.id}>
                      {formatDate(rev.enactmentDate)} ({getTypeLabel(rev.revisionType)})
                    </option>
                  ))}
                </select>
              </td>
            </tr>
            
            {/* 제목 */}
            <tr>
              <th className="bg-slate-50 text-left px-4 py-4 border-b border-slate-200 font-bold text-slate-700 align-middle">제목</th>
              <td className="px-4 py-4 border-b border-slate-200 font-bold text-slate-800 bg-white text-[15px]">
                <span className="text-blue-600 mr-2">{ruleData?.ruleNumber || ""}</span>
                {ruleData?.title || ""}
              </td>
            </tr>

            {/* 제개정유형 */}
            {selectedRev && (
              <tr>
                <th className="bg-slate-50 text-left px-4 py-4 border-b border-slate-200 font-bold text-slate-700 align-middle">제개정유형</th>
                <td className="px-4 py-4 border-b border-slate-200 bg-white">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[14px] font-bold shadow-sm ${
                    selectedRev.revisionType === 'ENACTMENT' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                    selectedRev.revisionType === 'TOTAL_AMENDMENT' || selectedRev.revisionType === 'FULL_REVISION' ? 'bg-red-100 text-red-700 border border-red-200' :
                    selectedRev.revisionType === 'ABOLITION' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                    'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}>
                    {getTypeLabel(selectedRev.revisionType)}
                  </span>
                </td>
              </tr>
            )}

            {/* 개정일/제정일 */}
            {selectedRev && (
              <tr>
                <th className="bg-slate-50 text-left px-4 py-4 border-b border-slate-200 font-bold text-slate-700 align-middle">
                  {selectedRev.revisionType === 'ENACTMENT' ? '제정일' : '개정일'}
                </th>
                <td className="px-4 py-4 border-b border-slate-200 text-slate-800 font-medium bg-white text-[15px]">
                  {isEditingDesc ? (
                    <input 
                      type="date" 
                      value={editEnactDate} 
                      onChange={(e) => setEditEnactDate(e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-[15px] bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm font-medium"
                    />
                  ) : (
                    formatDate(selectedRev.enactmentDate)
                  )}
                </td>
              </tr>
            )}

            {/* 시행일 */}
            {selectedRev && (
              <tr>
                <th className="bg-slate-50 text-left px-4 py-4 border-b border-slate-200 font-bold text-slate-700 align-middle">시행일</th>
                <td className="px-4 py-4 border-b border-slate-200 text-slate-800 font-medium bg-white text-[15px]">
                  {isEditingDesc ? (
                    <input 
                      type="date" 
                      value={editEffDate} 
                      onChange={(e) => setEditEffDate(e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-[15px] bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm font-medium"
                    />
                  ) : (
                    formatDate(selectedRev.effectiveDate)
                  )}
                </td>
              </tr>
            )}

            {/* 소관부서 */}
            {ruleData?.department && (
              <tr>
                <th className="bg-slate-50 text-left px-4 py-4 border-b border-slate-200 font-bold text-slate-700 align-middle">소관부서</th>
                <td className="px-4 py-4 border-b border-slate-200 text-slate-800 font-medium bg-white text-[15px]">
                  {ruleData.department.name}
                </td>
              </tr>
            )}

            {/* 원문파일 (본문/전문만 표시) */}
            <tr>
              <th className="bg-slate-50 text-left px-4 py-4 border-b border-slate-200 font-bold text-slate-700 align-middle">
                원문파일
                {isAdmin && (
                  <>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".hwp,.pdf"
                      className="hidden" 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="ml-2 text-[12px] bg-amber-50 text-amber-700 px-2.5 py-1 rounded border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer font-bold shadow-sm inline-flex items-center gap-1 disabled:opacity-50"
                      title="원문파일 업로드"
                    >
                      {isUploading ? "업로드 중..." : "📤 파일 첨부"}
                    </button>
                  </>
                )}
              </th>
              <td className="px-4 py-4 border-b border-slate-200 bg-white">
                {mainAttachments.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {mainAttachments.map((att: any, idx: number) => {
                      const isHwp = att.fileUrl?.toLowerCase().endsWith('.hwp') || att.title?.toLowerCase().endsWith('.hwp');
                      const isPdf = att.fileUrl?.toLowerCase().endsWith('.pdf') || att.title?.toLowerCase().endsWith('.pdf');
                      const fileUrl = att.fileUrl?.startsWith('http') 
                        ? `/api/files/download?url=${encodeURIComponent(att.fileUrl)}&filename=${encodeURIComponent(att.title || 'file')}`
                        : att.fileUrl;
                      return (
                        <div key={idx} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm">
                          <a
                            href={fileUrl}
                            download
                            className="inline-flex items-center gap-2 text-[14px] font-bold text-blue-700 cursor-pointer"
                          >
                            {isHwp && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[11px] font-black border border-blue-200">HWP</span>}
                            {isPdf && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[11px] font-black border border-red-200">PDF</span>}
                            {!isHwp && !isPdf && <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] font-black border border-gray-200">FILE</span>}
                            {att.title || "전문 다운로드"}
                          </a>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteAttachment(att.id)}
                              className="ml-1 text-slate-400 hover:text-red-600 font-bold text-[13px] px-1 cursor-pointer transition-colors"
                              title="파일 삭제"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-slate-400 text-[15px] italic font-medium">
                    등록된 전문 파일이 없습니다.
                    {isAdmin && <span className="ml-1 text-blue-500 not-italic font-bold">상단의 '파일 첨부' 버튼을 통해 즉시 등록해 주세요.</span>}
                  </div>
                )}
              </td>
            </tr>

            {/* 개정내용 */}
            {selectedRev && (
              <tr>
                <th className="bg-slate-50 text-left px-4 py-4 border-b border-slate-200 font-bold text-slate-700 align-top">
                  개정내용
                  {isAdmin && !isEditingDesc && (
                    <button 
                      onClick={() => { 
                        setIsEditingDesc(true); 
                        setEditDescText(selectedRev.description || ""); 
                        setEditEnactDate(selectedRev.enactmentDate ? new Date(selectedRev.enactmentDate).toISOString().split('T')[0] : "");
                        setEditEffDate(selectedRev.effectiveDate ? new Date(selectedRev.effectiveDate).toISOString().split('T')[0] : "");
                      }}
                      className="ml-2 text-[12px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer font-bold shadow-sm inline-flex items-center gap-1"
                      title="개정내용 및 날짜 편집"
                    >
                      ✏️ 편집
                    </button>
                  )}
                </th>
                <td className="px-4 py-4 border-b border-slate-200 text-slate-800 bg-white">
                  {isEditingDesc ? (
                    <div className="flex flex-col gap-2.5">
                      <textarea
                        value={editDescText}
                        onChange={(e) => setEditDescText(e.target.value)}
                        placeholder="개정내용을 입력하세요. (예: 제5조 제2항 삭제, 제10조 신설 등)"
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-[15px] min-h-[160px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm leading-relaxed"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setIsEditingDesc(false)}
                          className="px-4 py-2 text-[14px] text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer font-bold shadow-sm"
                        >
                          취소
                        </button>
                        <button 
                          onClick={handleSaveDescription}
                          disabled={isSavingDesc}
                          className="px-4 py-2 text-[14px] text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer font-bold shadow-sm disabled:opacity-50 flex items-center gap-1"
                        >
                          {isSavingDesc ? "저장 중..." : "💾 저장"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    selectedRev.description ? (
                      <div className="whitespace-pre-wrap leading-relaxed text-[15px] font-medium">{selectedRev.description}</div>
                    ) : (
                      <div className="text-slate-400 text-[15px] italic font-medium">
                        등록된 개정내용이 없습니다.
                        {isAdmin && <span className="ml-1 text-blue-500 not-italic font-bold">위 편집 버튼을 클릭하여 개정내용을 관리해 주세요.</span>}
                      </div>
                    )
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 하단 */}
      <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex justify-between items-center shadow-inner">
        <p className="text-[11px] text-slate-500 font-bold">
          전체 <span className="text-blue-600 font-black">{revisions.length}</span>건의 연혁 정보
        </p>
        <button 
          onClick={() => window.close()}
          className="px-4 py-1.5 text-[12px] font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer shadow-sm"
        >
          창 닫기
        </button>
      </div>

      {/* 연혁 추가 모달 */}
      {isCreatingRev && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] border border-slate-200 w-full max-w-md overflow-hidden animate-fade-in">
            <div className="bg-[#0c3161] px-6 py-4 flex justify-between items-center">
              <h3 className="text-white font-bold text-[16px] flex items-center gap-2">
                <span>➕</span> 과거 개정 연혁 추가
              </h3>
              <button 
                onClick={() => !isSubmittingRev && setIsCreatingRev(false)}
                className="text-slate-300 hover:text-white transition-colors text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-[13px]">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-blue-900 font-medium leading-relaxed">
                💡 규정 본문(부칙)에만 존재하고 시스템 연혁에 누락된 과거 개정 일자(예: 2020. 8. 5.)를 손쉽게 DB에 적재할 수 있습니다.
              </div>
              
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">제개정유형</label>
                <select 
                  value={newRevType} 
                  onChange={(e) => setNewRevType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:border-blue-500 shadow-sm font-medium"
                >
                  <option value="AMENDMENT">일부개정</option>
                  <option value="TOTAL_AMENDMENT">전부개정</option>
                  <option value="ENACTMENT">제정</option>
                  <option value="ABOLITION">폐지</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">개정일자 (공포일/시행일)</label>
                <input 
                  type="date" 
                  value={newRevDate} 
                  onChange={(e) => setNewRevDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:border-blue-500 shadow-sm font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">개정내용 요약 (선택)</label>
                <textarea 
                  value={newRevDesc} 
                  onChange={(e) => setNewRevDesc(e.target.value)}
                  placeholder="예: 제11조 및 부칙 개정 반영"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white min-h-[80px] resize-y focus:outline-none focus:border-blue-500 shadow-sm font-medium leading-relaxed"
                />
              </div>
            </div>
            
            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !isSubmittingRev && setIsCreatingRev(false)}
                className="px-4 py-2 border border-slate-300 bg-white text-slate-700 font-bold rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
                disabled={isSubmittingRev}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleCreateRevision}
                disabled={isSubmittingRev}
                className="px-4 py-2 bg-[#0c3161] text-white font-bold rounded-lg hover:bg-blue-800 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmittingRev ? "생성 중..." : "🚀 연혁 추가하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
