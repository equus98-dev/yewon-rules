"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { CircularProgress, Button, Typography, Paper, Snackbar, Alert } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const JoditEditor = dynamic(() => import("jodit-react"), {
  ssr: false,
  loading: () => <p className="p-4 text-slate-500">에디터 불러오는 중...</p>,
});

export default function RuleEditPage({ id }: { id: string }) {
  const router = useRouter();
  const editorRef = useRef(null);

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
        const data = (await res.json()) as any;
        
        setRuleData(data);
        const rev = data.currentRevision;
        if (rev) {
          setRevisionId(rev.id);
          const existingHtml = rev.articles.find((a: any) => a.contentHtml && a.contentHtml.trim() !== "")?.contentHtml;
          
          if (existingHtml) {
            setContentHtml(existingHtml);
          } else {
            const rawText = rev.articles.map((a: any) => a.contentText).join("\n\n");
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
        router.back(); 
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setToast({ open: true, message: err.message, type: "error" });
      setSaving(false);
    }
  };

  const config = useMemo(() => ({
    readonly: false,
    placeholder: '여기에 규정 내용을 입력하세요...',
    height: 600,
    style: {
      fontFamily: "'Pretendard', sans-serif",
      fontSize: "15px",
    },
    buttons: [
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'ul', 'ol', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'table', 'link', 'image', '|',
      'align', 'undo', 'redo', 'hr', 'eraser', 'fullsize',
    ]
  }), []);

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
              자유롭게 규정의 내용을 꾸미고 표를 추가 및 수정할 수 있습니다. 수정한 내용은 사용자 화면에 그대로 반영됩니다.
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
            <strong>안내:</strong> 상단의 '표(Table)' 도구를 이용해 자유롭게 표를 그리고 수정할 수 있습니다.
          </div>
          <div className="flex-1">
            <JoditEditor
              ref={editorRef}
              value={contentHtml}
              config={config}
              onBlur={newContent => setContentHtml(newContent)}
              onChange={newContent => {}}
            />
          </div>
        </Paper>
      </div>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.type as any} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
