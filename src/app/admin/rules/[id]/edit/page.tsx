"use client";
export const runtime = "edge";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { CircularProgress, Button, Typography, Paper, Snackbar, Alert } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import "react-quill/dist/quill.snow.css";

// ReactQuill은 클라이언트 사이드에서만 렌더링되도록 동적 로딩 설정
const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => <p className="p-4 text-slate-500">에디터 불러오는 중...</p>,
});

// ReactQuill 모듈 구성 (Toolbar 설정 등)
const modules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ size: [] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
    [{ align: [] }],
    [{ color: [] }, { background: [] }],
    ["link", "image"],
    ["clean"],
  ],
};

const formats = [
  "header", "font", "size",
  "bold", "italic", "underline", "strike", "blockquote",
  "list", "bullet", "indent",
  "align", "color", "background",
  "link", "image"
];

export default function RuleEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ruleData, setRuleData] = useState<any>(null);
  const [contentHtml, setContentHtml] = useState("");
  const [revisionId, setRevisionId] = useState("");

  const [toast, setToast] = useState({ open: false, message: "", type: "success" });

  useEffect(() => {
    async function loadRule() {
      try {
        const res = await fetch(`/api/rules/${id}`);
        if (!res.ok) throw new Error("규정을 불러오는데 실패했습니다.");
        const data = await res.json();
        
        setRuleData(data);
        const rev = data.currentRevision;
        if (rev) {
          setRevisionId(rev.id);
          // 기존에 HTML로 저장된 내용이 있으면 그것을 불러옴
          const existingHtml = rev.articles.find((a: any) => a.contentHtml && a.contentHtml.trim() !== "")?.contentHtml;
          
          if (existingHtml) {
            setContentHtml(existingHtml);
          } else {
            // 없는 경우 기존 구조화된 텍스트를 단순 합쳐서 초기값으로 제공
            const rawText = rev.articles.map((a: any) => a.contentText).join("\n\n");
            // 줄바꿈을 p 태그 등으로 처리하여 에디터에 넣기 쉽게 변환
            const htmlText = rawText.split("\n").map((line: string) => `<p>${line}</p>`).join("");
            setContentHtml(htmlText);
          }
        }
      } catch (err) {
        console.error(err);
        setToast({ open: true, message: "데이터 로딩 오류", type: "error" });
      } finally {
        setLoading(false);
      }
    }
    loadRule();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentHtml,
          revisionId,
        }),
      });

      if (!res.ok) throw new Error("저장에 실패했습니다.");

      setToast({ open: true, message: "성공적으로 저장되었습니다.", type: "success" });
      setTimeout(() => {
        router.back(); // 이전 페이지(규정 뷰어 등)로 돌아가기
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setToast({ open: true, message: err.message, type: "error" });
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 bg-slate-50">
        <CircularProgress />
        <Typography variant="body1" className="mt-4 text-slate-500">데이터를 불러오는 중입니다...</Typography>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full">
        {/* 헤더 영역 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.back()}
              className="mb-2 text-slate-500"
              size="small"
            >
              돌아가기
            </Button>
            <h1 className="text-2xl font-bold text-slate-800">
              규정 편집기 <span className="text-blue-600">[{ruleData?.title}]</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              자유롭게 규정의 내용을 꾸미고 수정할 수 있습니다. 수정한 내용은 사용자 화면에 그대로 반영됩니다.
            </p>
          </div>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
            size="large"
            className="shadow-md"
          >
            {saving ? "저장 중..." : "변경사항 저장"}
          </Button>
        </div>

        {/* 에디터 영역 */}
        <Paper elevation={0} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col" style={{ minHeight: '600px' }}>
          <div className="bg-amber-50 p-3 border-b border-amber-200 text-amber-800 text-sm flex items-center gap-2">
            <strong>안내:</strong> 웹 에디터(WYSIWYG)로 규정을 수정하면 기존의 구조화된 자동 들여쓰기 대신 에디터에서 작성한 화면이 그대로 렌더링됩니다.
          </div>
          <div className="flex-1 ql-editor-wrapper">
            <ReactQuill
              theme="snow"
              value={contentHtml}
              onChange={setContentHtml}
              modules={modules}
              formats={formats}
              className="h-[600px] border-none"
            />
          </div>
        </Paper>
      </div>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.type as any} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>

      <style jsx global>{`
        .ql-container {
          font-family: 'Pretendard', sans-serif !important;
          font-size: 15px !important;
          border: none !important;
        }
        .ql-toolbar {
          border-left: none !important;
          border-right: none !important;
          border-top: none !important;
          background-color: #f8fafc;
          padding: 12px 8px !important;
        }
        .ql-editor {
          min-height: 550px;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
