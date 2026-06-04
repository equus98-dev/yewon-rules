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
} from "@mui/material";
import { RichTreeView } from "@mui/x-tree-view/RichTreeView";
import FolderIcon from "@mui/icons-material/Folder";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function AdminFilesManagement() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  
  const [activeRule, setActiveRule] = useState<{ id: string; name: string } | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [targetAttachmentId, setTargetAttachmentId] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories?type=field");
        const data = await res.json();
        
        // Convert to RichTreeView format
        const convertToMuiTree = (nodes: any[]): any[] => {
          return nodes.map((node) => ({
            id: node.id,
            label: node.name,
            type: node.type,
            children: node.children && node.children.length > 0 ? convertToMuiTree(node.children) : undefined,
          }));
        };
        
        setCategories(convertToMuiTree(data));
      } catch (error) {
        console.error("Failed to load categories:", error);
      } finally {
        setLoadingCats(false);
      }
    }
    loadCategories();
  }, []);

  const handleItemClick = async (event: React.SyntheticEvent, itemId: string) => {
    // Check if it's a rule (not a category folder). Rule IDs are UUIDs, category IDs start with 'cat-' or 'virtual-'
    if (itemId.startsWith("cat-") || itemId.startsWith("virtual-")) return;
    
    // Find rule name
    let ruleName = "규정";
    const findName = (nodes: any[]): string | null => {
      for (const n of nodes) {
        if (n.id === itemId) return n.label;
        if (n.children) {
          const found = findName(n.children);
          if (found) return found;
        }
      }
      return null;
    };
    ruleName = findName(categories) || "규정";

    setActiveRule({ id: itemId, name: ruleName });
    loadAttachments(itemId);
  };

  const loadAttachments = async (ruleId: string) => {
    setLoadingAttachments(true);
    try {
      const res = await fetch(`/api/admin/files?ruleId=${ruleId}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setAttachments(data);
    } catch (e) {
      console.error(e);
      setAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const triggerUpload = (attachmentId: string) => {
    setTargetAttachmentId(attachmentId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeRule || !targetAttachmentId) return;

    if (!file.name.toLowerCase().endsWith(".hwp")) {
      alert("HWP 파일만 업로드할 수 있습니다.");
      return;
    }

    setUploading(targetAttachmentId);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("ruleId", activeRule.id);
    formData.append("attachmentId", targetAttachmentId);

    try {
      const res = await fetch("/api/admin/files", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "업로드 실패");
      
      alert("파일이 성공적으로 교체되었습니다.");
      loadAttachments(activeRule.id);
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(error.message || "파일 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(null);
      setTargetAttachmentId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-6 md:p-8 h-full flex flex-col font-['Pretendard']">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#0c3161] flex items-center gap-2">
          서식/규정파일 관리
        </h1>
        <p className="text-sm text-slate-500 font-bold mt-2">
          각 규정에 연결된 원본 서식 및 HWP 파일을 조회하고 개별적으로 새 파일로 교체(업로드)할 수 있습니다.
        </p>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left: Tree View */}
        <div className="w-1/3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-700">규정 목록 트리</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 scrollbar">
            {loadingCats ? (
              <div className="flex justify-center py-10">
                <CircularProgress size={24} />
              </div>
            ) : (
              <RichTreeView
                items={categories}
                onItemClick={handleItemClick}
                sx={{
                  "& .MuiTreeItem-content": {
                    py: 0.5,
                    px: 1,
                    borderRadius: 1,
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* Right: Attachments View */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {activeRule ? (
            <>
              <div className="p-5 border-b border-slate-100 bg-[#0c3161]/5 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-lg text-[#0c3161]">{activeRule.name}</h3>
                  <p className="text-xs text-slate-500 font-bold mt-1">첨부파일 목록 및 교체</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 scrollbar bg-slate-50">
                {loadingAttachments ? (
                  <div className="flex justify-center py-10">
                    <CircularProgress size={24} />
                  </div>
                ) : attachments.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
                    <InsertDriveFileIcon sx={{ fontSize: 40, color: "#cbd5e1", mb: 1 }} />
                    <p className="text-slate-500 font-bold">등록된 첨부파일(서식)이 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attachments.map((file) => (
                      <div key={file.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-blue-200 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                            <span className="text-red-600 font-black text-xs">HWP</span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-800 text-sm truncate">{file.title}</h4>
                            <p className="text-xs text-slate-500 mt-1 truncate">
                              {file.fileUrl.split("/").pop()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          <a 
                            href={file.fileUrl.startsWith('http') ? `${file.fileUrl}?download=${encodeURIComponent(file.title + '.hwp')}` : file.fileUrl} 
                            download={`${file.title}.hwp`}
                            target="_blank"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                          >
                            <DownloadIcon sx={{ fontSize: 16 }} />
                            다운로드
                          </a>
                          <button
                            onClick={() => triggerUpload(file.id)}
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                  <CheckCircleIcon sx={{ color: "#3b82f6", mt: 0.5 }} />
                  <div className="text-sm font-bold text-blue-900 leading-relaxed">
                    <p className="mb-1">파일 교체 완료 시, 사용자 화면의 '서식' 메뉴에서도 즉시 교체된 새 파일로 다운로드가 가능해집니다.</p>
                    <p className="text-blue-700/80">※ HWP 확장자 파일만 업로드가 가능합니다. 교체 전 [다운로드] 버튼을 통해 기존 양식을 꼭 확인해 주세요.</p>
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
      
      {/* 숨겨진 파일 인풋 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".hwp"
        className="hidden"
      />
    </div>
  );
}
