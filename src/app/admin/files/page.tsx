"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  CircularProgress,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Typography
} from "@mui/material";
import SidebarTree from "@/components/SidebarTree";
import FolderIcon from "@mui/icons-material/Folder";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

export default function AdminFilesManagement() {
  const [activeRule, setActiveRule] = useState<{ id: string; name: string } | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  
  // Upload state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<"전문" | "별표" | "별지">("전문");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [targetAttachmentId, setTargetAttachmentId] = useState<string | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  const handleSelectRule = (ruleId: string) => {
    // In SidebarTree we don't have the rule name directly from onSelectRule, 
    // but we can just set "선택된 규정" and it will load. Or we could fetch it.
    setActiveRule({ id: ruleId, name: "선택된 규정" });
    loadAttachments(ruleId);
  };

  const loadAttachments = async (ruleId: string) => {
    setLoadingAttachments(true);
    try {
      const res = await fetch(`/api/admin/files?ruleId=${ruleId}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as any;
      setAttachments(data);
      setSelectedFileIds([]);
    } catch (e) {
      console.error(e);
      setAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const openUploadModal = (attachmentId: string | null) => {
    setTargetAttachmentId(attachmentId);
    setSelectedFile(null);
    setUploadType("전문");
    setUploadModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".hwp") && !file.name.toLowerCase().endsWith(".pdf")) {
      alert("HWP 또는 PDF 파일만 업로드할 수 있습니다.");
      e.target.value = "";
      return;
    }
    setSelectedFile(file);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile || !activeRule) return;

    setUploading(targetAttachmentId || "new");
    setUploadModalOpen(false);
    
    // Prefix the file name with the selected type
    const originalName = selectedFile.name;
    // Clean up existing prefixes if any to avoid [전문] [별표] ...
    const cleanName = originalName.replace(/^\[(전문|별표|별지)\]\s*/, '');
    const newFileName = `[${uploadType}] ${cleanName}`;
    
    const modifiedFile = new File([selectedFile], newFileName, { type: selectedFile.type });

    const formData = new FormData();
    formData.append("file", modifiedFile);
    formData.append("ruleId", activeRule.id);
    if (targetAttachmentId) {
      formData.append("attachmentId", targetAttachmentId);
    }

    try {
      const res = await fetch("/api/admin/files", {
        method: "POST",
        body: formData,
      });
      
      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data.error || "업로드 실패");
      
      alert(targetAttachmentId ? "파일이 성공적으로 교체되었습니다." : "파일이 성공적으로 추가되었습니다.");
      loadAttachments(activeRule.id);
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(error.message || "파일 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(null);
      setTargetAttachmentId(null);
      setSelectedFile(null);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm("이 첨부파일을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/admin/files?id=${attachmentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("삭제 실패");
      alert("삭제되었습니다.");
      if (activeRule) loadAttachments(activeRule.id);
    } catch (error: any) {
      alert(error.message || "삭제 중 오류가 발생했습니다.");
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedFileIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = async () => {
    if (selectedFileIds.length === 0) return;
    if (!confirm(`선택하신 ${selectedFileIds.length}개의 첨부파일을 일괄 삭제하시겠습니까?`)) return;
    
    let successCount = 0;
    try {
      for (const id of selectedFileIds) {
         const res = await fetch(`/api/admin/files?id=${id}`, { method: "DELETE" });
         if (res.ok) successCount++;
      }
      alert(`총 ${successCount}개의 파일이 삭제되었습니다.`);
      setSelectedFileIds([]);
      if (activeRule) loadAttachments(activeRule.id);
    } catch (error: any) {
      alert("일괄 삭제 중 오류가 발생했습니다.");
    }
  };

  // Divide files
  const mainFiles = attachments.filter(f => f.title.startsWith("[전문]"));
  const subFiles = attachments.filter(f => f.title.startsWith("[별표]") || f.title.startsWith("[별지]") || !f.title.startsWith("[전문]"));

  const renderFileList = (files: any[], emptyMessage: string) => {
    if (files.length === 0) {
      return (
        <div className="text-center py-6 bg-white rounded-xl border border-slate-200 border-dashed mb-6">
          <p className="text-slate-500 font-bold text-sm">{emptyMessage}</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-3 mb-6">
        {files.map((file) => {
          const isPdf = file.fileType?.toLowerCase() === 'pdf' || file.title.toLowerCase().endsWith('.pdf');
          
          return (
            <div key={file.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-blue-200 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <input 
                  type="checkbox" 
                  checked={selectedFileIds.includes(file.id)}
                  onChange={() => handleToggleSelect(file.id)}
                  className="w-4 h-4 cursor-pointer mr-1"
                />
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${isPdf ? 'bg-red-50 border-red-100 text-red-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                  <span className="font-black text-xs">{isPdf ? 'PDF' : 'HWP'}</span>
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-800 text-[15px] truncate">{file.title}</h4>
                  <p className="text-[13px] text-slate-500 mt-1 truncate">
                    {decodeURIComponent(file.fileUrl.split("/").pop() || "")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <a 
                  href={(() => {
                    const encodedTitle = encodeURIComponent(file.title);
                    if (file.fileUrl.startsWith('/api/files/')) {
                      return `${file.fileUrl}?download=true&filename=${encodedTitle}`;
                    }
                    if (file.fileUrl.startsWith('http')) {
                      return `${file.fileUrl}?download=${encodedTitle}`;
                    }
                    return `/api/download?fileUrl=${encodeURIComponent(file.fileUrl)}&filename=${encodedTitle}`;
                  })()}
                  download={file.title}
                  target="_blank"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                >
                  <DownloadIcon sx={{ fontSize: 16 }} />
                  다운로드
                </a>
                <button
                  onClick={() => openUploadModal(file.id)}
                  disabled={uploading === file.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0c3161] hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  {uploading === file.id ? (
                    <CircularProgress size={14} sx={{ color: "white" }} />
                  ) : (
                    <UploadFileIcon sx={{ fontSize: 16 }} />
                  )}
                  {uploading === file.id ? "업로드 중..." : "파일 교체"}
                </button>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors shadow-sm ml-1"
                >
                  삭제
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8 h-full flex flex-col font-['Pretendard']">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#0c3161] flex items-center gap-2">
          서식/규정파일 관리
        </h1>
        <p className="text-sm text-slate-500 font-bold mt-2">
          각 규정에 연결된 전문(본문) 원본 파일과 별표/별지 첨부파일을 조회하고 업로드할 수 있습니다.
        </p>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left: Tree View (Using SidebarTree) */}
        <div className="w-[380px] bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden shrink-0">
          <SidebarTree 
            activeRuleId={activeRule?.id} 
            onSelectRule={handleSelectRule} 
            hideVerticalMenu={true}
          />
        </div>

        {/* Right: Attachments View */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {activeRule ? (
            <>
              <div className="p-5 border-b border-slate-100 bg-[#0c3161]/5 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-lg text-[#0c3161]">첨부파일 목록 및 업로드</h3>
                  <p className="text-xs text-slate-500 font-bold mt-1">파일의 유형을 구분하여 첨부하세요.</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedFileIds.length > 0 && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleBatchDelete}
                      sx={{ fontWeight: 'bold' }}
                    >
                      선택 일괄 삭제 ({selectedFileIds.length})
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    startIcon={<UploadFileIcon />}
                    onClick={() => openUploadModal(null)}
                    disabled={uploading === "new"}
                    sx={{ bgcolor: "#0c3161", "&:hover": { bgcolor: "#092244" }, boxShadow: 'none' }}
                  >
                    새 파일 첨부
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 scrollbar bg-slate-50">
                {loadingAttachments ? (
                  <div className="flex justify-center py-10">
                    <CircularProgress size={24} />
                  </div>
                ) : (
                  <>
                    <div className="mb-2 flex items-center gap-2">
                      <ArticleIcon sx={{ color: "#0c3161", fontSize: 20 }} />
                      <h4 className="font-bold text-slate-800 text-[15px]">규정 전문 파일</h4>
                    </div>
                    {renderFileList(mainFiles, "등록된 규정 전문 파일이 없습니다.")}

                    <Divider sx={{ my: 4 }} />

                    <div className="mb-2 flex items-center gap-2">
                      <AttachmentIcon sx={{ color: "#0c3161", fontSize: 20 }} />
                      <h4 className="font-bold text-slate-800 text-[15px]">별표 / 별지 첨부파일</h4>
                    </div>
                    {renderFileList(subFiles, "등록된 별표/별지 첨부파일이 없습니다.")}
                  </>
                )}
                
                <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                  <CheckCircleIcon sx={{ color: "#3b82f6", mt: 0.5 }} />
                  <div className="text-sm font-bold text-blue-900 leading-relaxed">
                    <p className="mb-1">파일 추가 시 업로드 다이얼로그에서 [전문], [별표], [별지] 유형을 선택하면 자동으로 파일명에 반영됩니다.</p>
                    <p className="text-blue-700/80">※ PDF 파일은 규정 본문 하단의 별지 뷰어에서 팝업이 아닌 내장 뷰어 형태로 즉시 미리보기가 가능해집니다.</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
              <FolderIcon sx={{ fontSize: 64, color: "#e2e8f0", mb: 2 }} />
              <p className="font-bold text-slate-500">좌측 트리에서 규정을 선택해 주세요.</p>
            </div>
          )}
        </div>
      </div>

      {/* 업로드 다이얼로그 모달 */}
      <Dialog open={uploadModalOpen} onClose={() => setUploadModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#0c3161', pb: 1 }}>파일 첨부 / 교체</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.secondary' }}>
            첨부파일 유형 선택
          </Typography>
          <FormControl component="fieldset" className="w-full mb-6">
            <RadioGroup
              row
              value={uploadType}
              onChange={(e) => setUploadType(e.target.value as any)}
            >
              <FormControlLabel value="전문" control={<Radio color="primary" />} label={<span className="text-sm font-bold">규정 전문</span>} />
              <FormControlLabel value="별표" control={<Radio color="primary" />} label={<span className="text-sm font-bold">별표</span>} />
              <FormControlLabel value="별지" control={<Radio color="primary" />} label={<span className="text-sm font-bold">별지</span>} />
            </RadioGroup>
          </FormControl>
          
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.secondary' }}>
            파일 선택 (HWP, PDF)
          </Typography>
          <div className="border border-slate-300 border-dashed rounded-lg p-6 bg-slate-50 flex flex-col items-center justify-center gap-3">
            <input
              type="file"
              onChange={handleFileSelect}
              accept=".hwp,.pdf"
              className="hidden"
              id="file-upload-input"
            />
            <label htmlFor="file-upload-input" className="cursor-pointer">
              <Button variant="outlined" component="span" startIcon={<UploadFileIcon />}>
                찾아보기
              </Button>
            </label>
            {selectedFile ? (
              <p className="text-sm font-bold text-blue-700 mt-2">{selectedFile.name}</p>
            ) : (
              <p className="text-xs text-slate-500 mt-2">선택된 파일이 없습니다.</p>
            )}
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setUploadModalOpen(false)} color="inherit" variant="outlined" sx={{ fontWeight: 'bold' }}>
            취소
          </Button>
          <Button 
            onClick={handleUploadSubmit} 
            disabled={!selectedFile}
            variant="contained" 
            sx={{ bgcolor: "#0c3161", "&:hover": { bgcolor: "#092244" }, fontWeight: 'bold', boxShadow: 'none' }}
          >
            업로드 실행
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

// Icon fallbacks for the ones missing from imports
function ArticleIcon(props: any) {
  return (
    <svg {...props} className={`w-5 h-5 ${props.className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function AttachmentIcon(props: any) {
  return (
    <svg {...props} className={`w-5 h-5 ${props.className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  );
}
