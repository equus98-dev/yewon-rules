"use client";

import { useState, useEffect } from "react";
import SidebarTree from "@/components/SidebarTree";

export default function OpinionsPage() {
  const [opinions, setOpinions] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  
  // 모드: list, write, read, edit
  const [mode, setMode] = useState<"list" | "write" | "read" | "edit">("list");
  const [selectedOpinion, setSelectedOpinion] = useState<any>(null);

  // 작성/수정용 폼 상태
  const [formData, setFormData] = useState({ title: "", content: "", author: "", password: "" });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // 비밀번호 확인용 상태
  const [verifyPassword, setVerifyPassword] = useState("");
  const [verifyMode, setVerifyMode] = useState<"read" | "edit" | "delete" | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCommentText, setAdminCommentText] = useState("");
  const [isEditingComment, setIsEditingComment] = useState(false);

  useEffect(() => {
    // 관리자 세션 체크
    const checkAdminSession = () => {
      const session = localStorage.getItem("yewon_admin_session");
      if (session === "authorized") {
        setIsAdmin(true);
      } else if (session && session !== "authorized") {
        const time = parseInt(session, 10);
        if (Date.now() - time < 1800 * 1000) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };
    checkAdminSession();
    const timer = setInterval(checkAdminSession, 2000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (mode === "list") {
      fetchOpinions();
    }
  }, [page, mode]);

  const fetchOpinions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/opinions?page=${page}&search=${search}`);
      const data = (await res.json()) as any;
      if (data.data) {
        setOpinions(data.data);
        setTotalPages(data.totalPages);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOpinions();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      if (f.size > 2 * 1024 * 1024) {
        alert("파일 크기는 2MB를 초과할 수 없습니다.");
        e.target.value = "";
        setFile(null);
        return;
      }
      setFile(f);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content || !formData.author || (!isAdmin && !formData.password)) {
      alert("모든 필수 항목을 입력해주세요.");
      return;
    }

    setUploading(true);
    let attachmentUrl = selectedOpinion?.attachmentUrl || null;
    let attachmentName = selectedOpinion?.attachmentName || null;

    if (file) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const uploadRes = await fetch("/api/opinions/upload", { method: "POST", body: fd });
        const uploadData = (await uploadRes.json()) as any;
        if (uploadData.error) {
          alert(uploadData.error);
          setUploading(false);
          return;
        }
        attachmentUrl = uploadData.fileUrl;
        attachmentName = uploadData.fileName;
      } catch (err) {
        alert("파일 업로드 중 오류가 발생했습니다.");
        setUploading(false);
        return;
      }
    }

    const payload = { ...formData, attachmentUrl, attachmentName };
    const method = mode === "edit" ? "PUT" : "POST";
    const url = mode === "edit" ? `/api/opinions/${selectedOpinion.id}${isAdmin ? "?admin=true" : ""}` : "/api/opinions";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await res.json()) as any;
      if (data.error) {
        alert(data.error);
      } else {
        alert(mode === "edit" ? "수정되었습니다." : "등록되었습니다.");
        setMode("list");
        setFile(null);
        setFormData({ title: "", content: "", author: "", password: "" });
      }
    } catch (err) {
      alert("오류가 발생했습니다.");
    }
    setUploading(false);
  };

  const viewOpinion = async (op: any) => {
    if (isAdmin) {
      try {
        const res = await fetch(`/api/opinions/${op.id}?admin=true`);
        const data = (await res.json()) as any;
        if (data.error) {
          alert(data.error);
          return;
        }
        setSelectedOpinion(data);
        setVerifyMode(null);
        setMode("read");
        setAdminCommentText(data.adminComment || "");
        setIsEditingComment(false);
      } catch (e) {
        alert("게시물 불러오기 중 오류가 발생했습니다.");
      }
    } else {
      setSelectedOpinion({ id: op.id, title: op.title, author: op.author, createdAt: op.createdAt });
      setVerifyMode("read");
      setMode("read");
    }
  };

  const handleVerifyPassword = async () => {
    if (!verifyPassword) {
      alert("비밀번호를 입력해주세요.");
      return;
    }
    try {
      const res = await fetch(`/api/opinions/${selectedOpinion.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: verifyPassword })
      });
      const data = (await res.json()) as any;
      if (data.valid) {
        if (verifyMode === "read") {
          setSelectedOpinion(data.data);
          setMode("read");
          setVerifyMode(null);
          setVerifyPassword("");
          setAdminCommentText(data.data.adminComment || "");
          setIsEditingComment(false);
        } else if (verifyMode === "edit") {
          setFormData({ title: selectedOpinion.title, content: selectedOpinion.content, author: selectedOpinion.author, password: verifyPassword });
          setMode("edit");
          setVerifyMode(null);
          setVerifyPassword("");
        } else if (verifyMode === "delete") {
          if (confirm("정말로 삭제하시겠습니까?")) {
            const delRes = await fetch(`/api/opinions/${selectedOpinion.id}?password=${encodeURIComponent(verifyPassword)}`, { method: "DELETE" });
            const delData = (await delRes.json()) as any;
            if (delData.success) {
              alert("삭제되었습니다.");
              setMode("list");
              setVerifyMode(null);
              setVerifyPassword("");
            } else {
              alert(delData.error);
            }
          }
        }
      } else {
        alert("비밀번호가 일치하지 않습니다.");
      }
    } catch (e) {
      alert("오류가 발생했습니다.");
    }
  };

  const handleAdminDelete = async () => {
    if (confirm("정말로 삭제하시겠습니까? (관리자 권한)")) {
      try {
        const delRes = await fetch(`/api/opinions/${selectedOpinion.id}?admin=true`, { method: "DELETE" });
        const delData = (await delRes.json()) as any;
        if (delData.success) {
          alert("삭제되었습니다.");
          setMode("list");
        } else {
          alert(delData.error);
        }
      } catch (e) {
        alert("오류가 발생했습니다.");
      }
    }
  };

  const handleAdminEdit = () => {
    setFormData({ title: selectedOpinion.title, content: selectedOpinion.content, author: selectedOpinion.author, password: "admin_override" });
    setMode("edit");
  };

  const handleSaveAdminComment = async () => {
    try {
      const res = await fetch(`/api/opinions/${selectedOpinion.id}?admin=true`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCommentUpdate: true, adminComment: adminCommentText })
      });
      const data = (await res.json()) as any;
      if (data.success) {
        alert("관리자 답변이 등록/수정되었습니다.");
        setSelectedOpinion({ ...selectedOpinion, adminComment: adminCommentText, adminCommentAt: new Date().toISOString() });
        setIsEditingComment(false);
      } else {
        alert(data.error || "오류가 발생했습니다.");
      }
    } catch (e) {
      alert("오류가 발생했습니다.");
    }
  };

  // 날짜 포맷
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 relative">
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 z-25 shrink-0 shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = '/'}>
          <img src="/UI.png" alt="예원예술대학교 로고" className="h-10 w-auto object-contain" />
          <span className="text-blue-900 font-extrabold text-lg ml-2 border-l border-slate-300 pl-3.5 hidden sm:inline-block tracking-tight">
            규정관리시스템
          </span>
          <span className="text-xs text-slate-400 font-bold tracking-wider hidden md:inline-block pt-1 ml-1">
            Yewon Arts University Rule Management
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => window.location.href = '/'} className="font-bold text-sm text-slate-700 hover:text-blue-900">홈으로</button>
          <span className="text-slate-300 font-bold select-none text-sm">|</span>
          <button onClick={() => window.location.href = '/admin'} className="font-bold text-sm text-slate-700 hover:text-blue-900">
            {isAdmin ? "관리자 모드 (활성)" : "관리자 로그인"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <div className="w-[375px] shrink-0 h-full border-r border-slate-200 z-10 hidden lg:block bg-white">
          <SidebarTree onSelectRule={() => {}} />
        </div>
        <main className="flex-1 flex flex-col py-6 px-4 md:px-6 overflow-y-auto w-full bg-[#f3f4f6]">
          <div className="w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
            <div className="flex justify-between items-center mb-8 border-b-2 border-[#1668a6] pb-4">
              <h1 className="text-3xl font-black text-[#0c3161]">의견수렴</h1>
              {isAdmin && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-extrabold border border-blue-300">
                  🛡️ 관리자 권한 활성화됨
                </span>
              )}
            </div>
          
          {mode === "list" && (
            <>
              <div className="flex justify-between items-center mb-4">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input type="text" placeholder="제목, 내용, 작성자 검색" value={search} onChange={e => setSearch(e.target.value)} className="border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 text-sm" />
                  <button type="submit" className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1.5 rounded text-sm font-bold transition-colors">검색</button>
                </form>
                <button onClick={() => { setMode("write"); setFormData({ title: "", content: "", author: "", password: "" }); setFile(null); }} className="bg-[#1668a6] hover:bg-[#0c3161] text-white px-4 py-2 rounded text-sm font-bold shadow transition-colors">
                  의견 작성하기
                </button>
              </div>

              <div className="overflow-hidden border border-slate-200 rounded-lg shadow-sm mb-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-sm border-b border-slate-200">
                      <th className="py-3 px-4 font-bold w-[50%]">제목</th>
                      <th className="py-3 px-4 font-bold text-center w-[15%]">작성자</th>
                      <th className="py-3 px-4 font-bold text-center w-[15%]">등록일</th>
                      <th className="py-3 px-4 font-bold text-center w-[10%]">첨부</th>
                      <th className="py-3 px-4 font-bold text-center w-[10%]">답변</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} className="text-center py-10 text-slate-500">불러오는 중...</td></tr>
                    ) : opinions.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-10 text-slate-500">등록된 의견이 없습니다.</td></tr>
                    ) : (
                      opinions.map(op => (
                        <tr key={op.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => viewOpinion(op)}>
                          <td className="py-3 px-4 text-slate-800 font-medium truncate">
                            <span className="mr-2 opacity-60" title="비밀글">🔒</span>
                            {op.title}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-600 text-sm truncate">{op.author}</td>
                          <td className="py-3 px-4 text-center text-slate-500 text-sm">{formatDate(op.createdAt)}</td>
                          <td className="py-3 px-4 text-center text-slate-500 text-sm">{op.attachmentName ? '📎' : ''}</td>
                          <td className="py-3 px-4 text-center text-sm">
                            {op.adminComment ? (
                              <span className="px-2 py-0.5 bg-green-100 text-green-800 font-bold text-xs rounded border border-green-300">답변완료</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded border border-slate-200">대기중</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)} className={`px-3 py-1 rounded text-sm font-bold ${page === i + 1 ? 'bg-[#1668a6] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {(mode === "write" || mode === "edit") && (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">작성자 <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:border-[#1668a6]" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">비밀번호 {isAdmin ? "(관리자 권한으로 생략 가능)" : <span className="text-red-500">*</span>}</label>
                  <input type="password" placeholder={isAdmin ? "관리자는 입력하지 않아도 됩니다." : "수정/삭제 시 필요합니다."} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:border-[#1668a6]" required={!isAdmin} disabled={isAdmin && mode === "edit"} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">제목 <span className="text-red-500">*</span></label>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:border-[#1668a6]" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">내용 <span className="text-red-500">*</span></label>
                <textarea rows={10} placeholder="의견을 자유롭게 작성해주세요. (HTML 태그는 사용할 수 없습니다)" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:border-[#1668a6] resize-y" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">첨부파일 (최대 2MB)</label>
                <input type="file" onChange={handleFileChange} className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-[#1668a6] hover:file:bg-slate-200" />
                {mode === "edit" && selectedOpinion?.attachmentName && !file && (
                  <p className="text-sm text-slate-500 mt-2">현재 첨부파일: {selectedOpinion.attachmentName}</p>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setMode(mode === "edit" ? "read" : "list")} className="px-5 py-2 border border-slate-300 text-slate-600 rounded font-bold hover:bg-slate-50 transition-colors">취소</button>
                <button type="submit" disabled={uploading} className="px-5 py-2 bg-[#1668a6] text-white rounded font-bold shadow hover:bg-[#0c3161] transition-colors disabled:opacity-50">
                  {uploading ? "저장 중..." : "저장하기"}
                </button>
              </div>
            </form>
          )}

          {mode === "read" && selectedOpinion && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">{selectedOpinion.title}</h2>
                <div className="flex gap-4 text-sm text-slate-500">
                  <span><strong className="text-slate-600">작성자:</strong> {selectedOpinion.author}</span>
                  <span><strong className="text-slate-600">등록일:</strong> {formatDate(selectedOpinion.createdAt)}</span>
                </div>
              </div>
              
              {verifyMode !== "read" && (
                <>
                  <div className="min-h-[250px] whitespace-pre-wrap text-slate-800 leading-relaxed text-[16px]">
                    {selectedOpinion.content}
                  </div>
                  
                  {selectedOpinion.attachmentUrl && (
                    <div className="mt-6 p-4 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-700">
                        <span>📎 첨부파일:</span>
                        <span className="font-bold">{selectedOpinion.attachmentName}</span>
                      </div>
                      <a href={selectedOpinion.attachmentUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-1.5 bg-white border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded shadow-sm">
                        다운로드
                      </a>
                    </div>
                  )}

                  {/* 관리자 답변 영역 */}
                  <div className="mt-8 border border-blue-200 bg-blue-50/50 rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4 border-b border-blue-200 pb-3">
                      <h3 className="font-extrabold text-blue-900 flex items-center gap-2 text-lg">
                        <span>💬</span> 관리자 답변
                      </h3>
                      {isAdmin && !isEditingComment && (
                        <button onClick={() => setIsEditingComment(true)} className="px-3 py-1.5 bg-[#1668a6] hover:bg-[#0c3161] text-white text-xs font-bold rounded shadow transition-colors">
                          {selectedOpinion.adminComment ? "답변 수정" : "답변 작성"}
                        </button>
                      )}
                    </div>

                    {isEditingComment ? (
                      <div className="space-y-4">
                        <textarea
                          rows={5}
                          placeholder="관리자 답변 내용을 입력해주세요."
                          value={adminCommentText}
                          onChange={e => setAdminCommentText(e.target.value)}
                          className="w-full border border-blue-300 bg-white rounded-lg p-3 text-sm focus:outline-none focus:border-[#1668a6] text-slate-800 resize-y"
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setIsEditingComment(false)} className="px-4 py-1.5 bg-white border border-slate-300 text-slate-600 text-sm font-bold rounded hover:bg-slate-50">취소</button>
                          <button onClick={handleSaveAdminComment} className="px-4 py-1.5 bg-[#1668a6] hover:bg-[#0c3161] text-white text-sm font-bold rounded shadow">답변 저장</button>
                        </div>
                      </div>
                    ) : selectedOpinion.adminComment ? (
                      <div className="text-slate-800 whitespace-pre-wrap leading-relaxed text-[15px]">
                        {selectedOpinion.adminComment}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm italic">아직 등록된 관리자 답변이 없습니다.</p>
                    )}
                  </div>
                </>
              )}

              {verifyMode && (
                <div className="mt-8 p-6 bg-slate-100 rounded-lg border border-slate-300">
                  <h3 className="font-bold text-slate-800 mb-3">{verifyMode === "read" ? "비밀글 확인" : verifyMode === "edit" ? "게시물 수정" : "게시물 삭제"}</h3>
                  <p className="text-sm text-slate-600 mb-3">작성 시 입력한 비밀번호를 입력해주세요.</p>
                  <div className="flex gap-2">
                    <input type="password" placeholder="비밀번호" value={verifyPassword} onChange={e => setVerifyPassword(e.target.value)} className="border border-slate-300 rounded px-3 py-2 flex-1 focus:outline-none focus:border-[#1668a6]" />
                    <button onClick={handleVerifyPassword} className="bg-[#1668a6] hover:bg-[#0c3161] text-white px-4 py-2 rounded font-bold shadow text-sm">확인</button>
                    <button onClick={() => { setVerifyMode(null); setVerifyPassword(""); }} className="bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded font-bold shadow-sm text-sm">취소</button>
                  </div>
                </div>
              )}

              {!verifyMode && (
                <div className="flex justify-between items-center pt-6 border-t border-slate-200">
                  <button onClick={() => setMode("list")} className="px-5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded font-bold transition-colors">
                    목록으로
                  </button>
                  <div className="flex gap-2">
                    {isAdmin ? (
                      <>
                        <button onClick={handleAdminEdit} className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300 rounded text-sm font-bold transition-colors">수정 (관리자)</button>
                        <button onClick={handleAdminDelete} className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 rounded text-sm font-bold transition-colors">삭제 (관리자)</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setVerifyMode("edit")} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-sm font-bold transition-colors">수정</button>
                        <button onClick={() => setVerifyMode("delete")} className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-bold transition-colors">삭제</button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
      </div>
    </div>
  );
}
