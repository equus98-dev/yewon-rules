"use client";

import React, { useState, useEffect } from "react";
import { CircularProgress, IconButton } from "@mui/material";
import CampaignIcon from "@mui/icons-material/Campaign";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";

export default function AdminNotices() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 모달 제어를 위한 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<any | null>(null);

  // 폼 필드 상태
  const [title, setTitle] = useState("");
  const [prefix, setPrefix] = useState("");
  const [content, setContent] = useState("");
  const [dept, setDept] = useState("기획조정팀");
  const [date, setDate] = useState("");

  const deptOptions = ["기획조정팀"];
  const prefixOptions = ["전체공지", "교직원 안내", ""];

  // 1. 공지사항 로드
  const loadNotices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notices");
      const data = (await res.json()) as any;
      if (Array.isArray(data)) {
        setNotices(data);
      }
    } catch (e) {
      console.error("Failed to load notices:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  // 오늘 날짜 문자열 획득 ("YYYY.MM.DD")
  const getTodayDateString = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}.${m}.${d}`;
  };

  // 2. 신규 공지 작성 모달 켜기
  const handleOpenAddModal = () => {
    setEditingNotice(null);
    setPrefix("전체공지");
    setTitle("");
    setContent("");
    setDept("기획조정팀");
    setDate(getTodayDateString());
    setModalOpen(true);
  };

  // 3. 기존 공지 수정 모달 켜기
  const handleOpenEditModal = (notice: any) => {
    setEditingNotice(notice);
    let noticeTitle = notice.title;
    let noticePrefix = "";
    const match = noticeTitle.match(/^\[(.*?)\]\s*(.*)$/);
    if (match && prefixOptions.includes(match[1])) {
      noticePrefix = match[1];
      noticeTitle = match[2];
    } else if (match && !prefixOptions.includes(match[1])) {
      // If it has a bracket but not in our standard options, just leave it in title or add it to options
      noticePrefix = match[1];
      noticeTitle = match[2];
    }
    
    setPrefix(noticePrefix);
    setTitle(noticeTitle);
    setContent(notice.content);
    setDept(notice.dept);
    setDate(notice.date);
    setModalOpen(true);
  };

  // 4. 공지 저장 (생성 또는 수정)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !dept || !date) {
      alert("모든 필수 입력 필드를 채워 주십시오.");
      return;
    }

    try {
      const isEdit = !!editingNotice;
      const url = "/api/notices";
      const method = isEdit ? "PUT" : "POST";
      const finalTitle = prefix ? `[${prefix}] ${title}` : title;
      const payload = isEdit 
        ? { id: editingNotice.id, title: finalTitle, content, dept, date } 
        : { title: finalTitle, content, dept, date };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setModalOpen(false);
        await loadNotices();
      } else {
        const err = (await res.json()) as any;
        alert(`저장 실패: ${err.error || "알 수 없는 에러"}`);
      }
    } catch (err: any) {
      alert(`에러 발생: ${err.message}`);
    }
  };

  // 5. 공지 삭제
  const handleDelete = async (id: string) => {
    if (!confirm("이 공지사항을 영구적으로 삭제하시겠습니까?")) {
      return;
    }

    try {
      const res = await fetch(`/api/notices?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadNotices();
      } else {
        const err = (await res.json()) as any;
        alert(`삭제 실패: ${err.error || "알 수 없는 에러"}`);
      }
    } catch (err: any) {
      alert(`에러 발생: ${err.message}`);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-8 bg-slate-50 scrollbar text-slate-800">
      <div className="w-full space-y-8 pb-10 px-2">
        
        {/* 상단 타이틀 및 퀵 런처 */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-6 select-none">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-black text-slate-850 tracking-tight flex items-center gap-2.5">
              <CampaignIcon sx={{ fontSize: 32, color: "#0c3161" }} />
              공지사항 관리 포털
            </h1>
            <p className="text-[13px] text-slate-500 font-bold">
              사용자 규정 시스템 메인 화면 및 사이드바의 실시간 긴급 공지를 직접 추가하고 제어합니다.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <IconButton 
              size="small" 
              onClick={loadNotices} 
              sx={{ color: "slate.650", border: "1px solid #e2e8f0", borderRadius: "12px", p: 1.2 }}
              className="bg-white hover:bg-slate-50"
            >
              <RefreshIcon sx={{ fontSize: 20, color: "#0c3161" }} />
            </IconButton>
            <button
              onClick={handleOpenAddModal}
              className="bg-[#0c3161] hover:bg-[#092244] text-white text-[14px] font-black px-5.5 py-3 rounded-xl shadow-lg shadow-[#0c3161]/10 hover:shadow-[#0c3161]/25 transition-all flex items-center gap-1.5 active:scale-95 select-none cursor-pointer"
            >
              <AddIcon sx={{ fontSize: 18, color: "white" }} />
              신규 공지 등록
            </button>
          </div>
        </div>

        {/* 메인 리스트 테이블 */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <CircularProgress size={30} sx={{ color: "#0c3161" }} />
            <span className="text-slate-500 text-sm font-semibold">실시간 공지 색인 수집 중...</span>
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-40 border border-slate-200 rounded-2xl bg-white text-slate-550 text-sm font-bold select-none shadow-sm">
            등록된 공지사항이 아직 존재하지 않습니다. 우측 상단의 신규 등록 버튼을 눌러 첫 공지를 띄워 보세요!
          </div>
        ) : (
          <div className="w-full bg-white border-t-2 border-[#007073] shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-[15px] text-left border-collapse">
                <thead>
                  <tr className="bg-[#007073] text-white select-none font-bold text-[15px]">
                    <th className="py-4 px-5 w-16 text-center font-black border-r border-[#009b9e]/40">번호</th>
                    <th className="py-4 px-4 w-32 text-center font-black border-r border-[#009b9e]/40">작성 부서</th>
                    <th className="py-4 px-4 font-black text-center">공지사항 제목</th>
                    <th className="py-4 px-4 w-36 text-center font-black border-l border-[#009b9e]/40">화면 노출일</th>
                    <th className="py-4 px-5 w-24 text-center font-black border-l border-[#009b9e]/40">관리 액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {notices.map((notice, idx) => (
                    <tr 
                      key={notice.id} 
                      className="border-b border-slate-200 hover:bg-slate-50 transition-colors group"
                    >
                      <td className="py-4 px-5 text-center text-slate-500 font-extrabold text-[16px] select-none">{idx + 1}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="bg-amber-50 text-amber-800 border border-amber-100 px-2.5 py-1 rounded-md text-[13px] font-black select-none">
                          {notice.dept}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1.5">
                          <h4 className="font-black text-slate-800 text-[16px] group-hover:text-blue-900 transition-colors leading-snug">
                            {notice.title}
                          </h4>
                          <p className="text-[14px] text-slate-450 font-bold max-w-xl truncate">
                            {notice.content}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center text-slate-600 font-bold select-none">{notice.date}</td>
                      <td className="py-4 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenEditModal(notice)}
                            sx={{ color: "slate.600", p: 0.8 }}
                            className="hover:bg-slate-100 rounded"
                          >
                            <EditIcon sx={{ fontSize: 18, color: "#0c3161" }} />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDelete(notice.id)}
                            sx={{ color: "slate.650", p: 0.8 }}
                            className="hover:bg-red-50 rounded"
                          >
                            <DeleteIcon sx={{ fontSize: 18, color: "#ef4444" }} />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* 6. 공지 등록/수정 모달 폼 다이얼로그 (프리미엄 라이트 테마) */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
          <form 
            onSubmit={handleSave}
            className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] hover:scale-[1.002] transition-all"
          >
            {/* 모달 헤더 */}
            <div className="bg-gradient-to-r from-[#0c3161] to-[#092244] p-5.5 text-white flex items-center justify-between border-b border-slate-200 shadow-sm">
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                <CampaignIcon sx={{ color: "#ffffff", fontSize: 22 }} />
                {editingNotice ? "공지사항 정보 개정" : "신규 긴급 공지 인입"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-200 hover:text-white text-lg font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 모달 내용 폼 */}
            <div className="p-6 overflow-y-auto space-y-5 text-[13px] font-bold text-slate-700">
              
              {/* 제목 인풋 */}
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1 space-y-2">
                  <label className="text-slate-600 flex items-center gap-1 pl-1">
                    <span className="text-[#0c3161]">•</span> 말머리
                  </label>
                  <select
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4.5 py-3.5 text-[13.5px] text-slate-850 focus:outline-none focus:ring-1 focus:ring-[#0c3161] focus:border-[#0c3161] font-extrabold cursor-pointer"
                  >
                    <option value="" className="text-slate-400">선택 안함</option>
                    <option value="전체공지">전체공지</option>
                    <option value="교직원 안내">교직원 안내</option>
                    <option value="의견수렴">의견수렴</option>
                    <option value="개정알림">개정알림</option>
                  </select>
                </div>
                <div className="col-span-3 space-y-2">
                  <label className="text-slate-600 flex items-center gap-1 pl-1">
                    <span className="text-[#0c3161]">•</span> 공지사항 제목
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="예: 학칙 개정에 따른 조문 최종 확정 공고"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4.5 py-3.5 text-[13.5px] text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0c3161] focus:border-[#0c3161] font-bold"
                  />
                </div>
              </div>

              {/* 작성부서 & 노출날짜 병렬 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-slate-600 flex items-center gap-1 pl-1">
                    <span className="text-[#0c3161]">•</span> 작성 부서
                  </label>
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4.5 py-3.5 text-[13.5px] text-slate-850 focus:outline-none focus:ring-1 focus:ring-[#0c3161] focus:border-[#0c3161] font-extrabold cursor-pointer"
                  >
                    {deptOptions.map((opt) => (
                      <option key={opt} value={opt} className="bg-white text-slate-800">{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-600 flex items-center gap-1 pl-1">
                    <span className="text-[#0c3161]">•</span> 화면 노출일 (YYYY.MM.DD)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="2026.05.31"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4.5 py-3.5 text-[13.5px] text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0c3161] focus:border-[#0c3161] font-bold"
                  />
                </div>
              </div>

              {/* 본문 에어리어 */}
              <div className="space-y-2">
                <label className="text-slate-600 flex items-center gap-1 pl-1">
                  <span className="text-[#0c3161]">•</span> 공지사항 상세 내용
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="사용자 화면의 모달과 사이드바에 실시간 노출될 전체 본문 내용을 격식 있고 구체적으로 기술하십시오..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4.5 py-3.5 text-[13.5px] text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0c3161] focus:border-[#0c3161] font-medium resize-none leading-relaxed"
                />
              </div>

            </div>

            {/* 모달 푸터 버튼 바 */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="border border-slate-200 text-slate-650 hover:bg-slate-100 hover:text-slate-900 text-[13.5px] font-black px-6 py-3 rounded-xl transition-all cursor-pointer select-none active:scale-95"
              >
                취소
              </button>
              <button
                type="submit"
                className="bg-[#0c3161] hover:bg-[#092244] text-[13.5px] font-white text-white font-black px-6 py-3 rounded-xl shadow-lg shadow-[#0c3161]/10 transition-all cursor-pointer select-none active:scale-95"
              >
                {editingNotice ? "변경사항 저장" : "새 공지 발행"}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
