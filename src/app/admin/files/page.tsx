"use client";
import { compareAttachmentNames } from '@/lib/utils';

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
  const [activeRuleRevisions, setActiveRuleRevisions] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  
  // Upload state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<"전문" | "별표" | "별지" | "별첨">("전문");
  const [selectedRevisionId, setSelectedRevisionId] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [targetAttachmentId, setTargetAttachmentId] = useState<string | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  const handleSelectRule = (ruleId: string) => {
    setActiveRule({ id: ruleId, name: "선택된 규정" });
    loadAttachments(ruleId);
  };

  const loadAttachments = async (ruleId: string) => {
    setLoadingAttachments(true);
    try {
      const [filesRes, ruleRes] = await Promise.all([
        fetch(`/api/admin/files?ruleId=${ruleId}`),
        fetch(`/api/rules/${ruleId}`)
      ]);
      if (!filesRes.ok) throw new Error("Failed to load files");
      const filesData = (await filesRes.json()) as any;
      setAttachments(filesData);
      setSelectedFileIds([]);

      if (ruleRes.ok) {
        const ruleData = (await ruleRes.json()) as any;
        const revs = ruleData.revisions || [];
        setActiveRuleRevisions(revs);
        if (revs.length > 0) {
          setSelectedRevisionId(revs[0].id);
        }
      }
    } catch (e) {
      console.error(e);
      setAttachments([]);
      setActiveRuleRevisions([]);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const openUploadModal = (attachmentId: string | null) => {
    setTargetAttachmentId(attachmentId);
    setSelectedFiles([]);
    setUploadType("전문");
    if (activeRuleRevisions.length > 0) {
      if (attachmentId) {
        const existing = attachments.find(a => a.id === attachmentId);
        if (existing && existing.revisionId) {
          setSelectedRevisionId(existing.revisionId);
        } else {
          setSelectedRevisionId(activeRuleRevisions[0].id);
        }
      } else {
        setSelectedRevisionId(activeRuleRevisions[0].id);
      }
    }
    setUploadModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const validFiles = files.filter(f => f.name.toLowerCase().endsWith(".hwp") || f.name.toLowerCase().endsWith(".pdf"));
    if (files.length !== validFiles.length) {
      alert("HWP 또는 PDF 파일만 업로드할 수 있습니다.");
    }
    
    if (targetAttachmentId && validFiles.length > 1) {
      alert("파일 교체 시에는 1개의 파일만 업로드할 수 있습니다.");
      setSelectedFiles([validFiles[0]]);
    } else {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;
    
    const validFiles = files.filter(f => f.name.toLowerCase().endsWith(".hwp") || f.name.toLowerCase().endsWith(".pdf"));
    if (files.length !== validFiles.length) {
      alert("HWP 또는 PDF 파일만 업로드할 수 있습니다.");
    }
    
    if (targetAttachmentId && validFiles.length > 1) {
      alert("파일 교체 시에는 1개의 파일만 업로드할 수 있습니다.");
      setSelectedFiles([validFiles[0]]);
    } else {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0 || !activeRule) return;

    setUploading(targetAttachmentId || "new");
    setUploadModalOpen(false);
    
    let successCount = 0;

    for (const file of selectedFiles) {
      const originalName = file.name;
      let cleanName = originalName;
      let newFileName = cleanName;
      
      const bracketMatch = cleanName.match(/^\[([^\]]+)\]\s*(.*)$/);
      if (bracketMatch) {
        const bracketText = bracketMatch[1];
        const restName = bracketMatch[2];
        if (bracketText.includes(uploadType) || bracketText.includes('별지') || bracketText.includes('별표') || bracketText.includes('별첨') || bracketText.includes('서식')) {
          newFileName = cleanName;
        } else {
          newFileName = `[${uploadType}] ${restName}`;
        }
      } else {
        newFileName = `[${uploadType}] ${cleanName}`;
      }
      
      const modifiedFile = new File([file], newFileName, { type: file.type });

      const formData = new FormData();
      formData.append("file", modifiedFile);
      formData.append("ruleId", activeRule.id);
      if (selectedRevisionId) {
        formData.append("revisionId", selectedRevisionId);
      }
      if (targetAttachmentId) {
        formData.append("attachmentId", targetAttachmentId);
      }

      try {
        const res = await fetch("/api/admin/files", {
          method: "POST",
          body: formData,
        });
        
        if (res.ok) {
          successCount++;
        } else {
          const data = (await res.json()) as any;
          console.error(data.error);
        }
      } catch (error: any) {
        console.error("Upload error:", error);
      }
    }
    
    alert(targetAttachmentId ? "파일이 성공적으로 교체되었습니다." : `총 ${successCount}개의 파일이 성공적으로 업로드되었습니다.`);
    loadAttachments(activeRule.id);
    
    setUploading(null);
    setTargetAttachmentId(null);
    setSelectedFiles([]);
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

  const handleToggleSelectAll = () => {
    if (selectedFileIds.length === attachments.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(attachments.map(a => a.id));
    }
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
  const subFiles = attachments
    .filter(f => f.title.startsWith("[별표]") || f.title.startsWith("[별지]") || f.title.startsWith("[별첨]") || !f.title.startsWith("[전문]"))
    .sort((a, b) => compareAttachmentNames(a.title, b.title));

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
          const matchedRev = activeRuleRevisions.find(r => r.id === file.revisionId);
          
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
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800 text-[15px] truncate">{file.title}</h4>
                    {matchedRev ? (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded border border-emerald-200 shrink-0">
                        {matchedRev.enactmentDate ? `${new Date(matchedRev.enactmentDate).toLocaleDateString()} (${matchedRev.revisionType === 'ENACTMENT' ? '제정' : '개정'})` : '연혁연결'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-bold rounded border border-slate-200 shrink-0">
                        공통/최신
                      </span>
                    )}
                  </div>
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
                  {attachments.length > 0 && (
                    <Button
                      variant="outlined"
                      onClick={handleToggleSelectAll}
                      sx={{ 
                        borderColor: '#cbd5e1', 
                        color: '#475569',
                        fontWeight: 'bold',
                        '&:hover': { bgcolor: '#f1f5f9', borderColor: '#94a3b8' }
                      }}
                    >
                      {selectedFileIds.length === attachments.length ? "전체 해제" : "전체 선택"}
                    </Button>
                  )}
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
                      <h4 className="font-bold text-slate-800 text-[15px]">별표 / 별지 / 별첨 첨부파일</h4>
                    </div>
                    {renderFileList(subFiles, "등록된 별표/별지/별첨 첨부파일이 없습니다.")}
                  </>
                )}
                
                <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                  <CheckCircleIcon sx={{ color: "#3b82f6", mt: 0.5 }} />
                  <div className="text-sm font-bold text-blue-900 leading-relaxed">
                    <p className="mb-1">파일 추가 시 업로드 다이얼로그에서 [전문], [별표], [별지], [별첨] 유형을 선택하면 자동으로 파일명에 반영됩니다.</p>
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
            연혁(제개정일별) 매칭 선택
          </Typography>
          <select
            value={selectedRevisionId}
            onChange={(e) => setSelectedRevisionId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer font-medium shadow-sm mb-6"
          >
            {activeRuleRevisions.map((rev: any) => (
              <option key={rev.id} value={rev.id}>
                {rev.enactmentDate ? `${new Date(rev.enactmentDate).toLocaleDateString()} (${rev.revisionType === 'ENACTMENT' ? '제정' : '개정'})` : '최신 개정'} - {rev.versionName || `v${rev.version}`}
              </option>
            ))}
          </select>

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
              <FormControlLabel value="별첨" control={<Radio color="primary" />} label={<span className="text-sm font-bold">별첨</span>} />
            </RadioGroup>
          </FormControl>
          
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.secondary' }}>
            파일 선택 (HWP, PDF)
          </Typography>
          <div 
            className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-3 transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              onChange={handleFileSelect}
              accept=".hwp,.pdf,.xls,.xlsx"
              className="hidden"
              id="file-upload-input"
              multiple={!targetAttachmentId}
            />
            <label htmlFor="file-upload-input" className="cursor-pointer">
              <Button variant="outlined" component="span" startIcon={<UploadFileIcon />}>
                파일 찾아보기
              </Button>
            </label>
            <p className="text-xs text-slate-500">또는 이곳에 파일을 드래그 앤 드롭 하세요.</p>
            
            {selectedFiles.length > 0 && (
              <div className="w-full mt-4 space-y-2 max-h-32 overflow-y-auto pr-2 scrollbar">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between bg-white border border-blue-100 p-2 rounded-md shadow-sm">
                    <p className="text-sm font-bold text-blue-700 truncate">{file.name}</p>
                    <button 
                      onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-red-500 hover:text-red-700 font-black text-xs px-2"
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setUploadModalOpen(false)} color="inherit" variant="outlined" sx={{ fontWeight: 'bold' }}>
            취소
          </Button>
          <Button 
            onClick={handleUploadSubmit} 
            disabled={selectedFiles.length === 0}
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
