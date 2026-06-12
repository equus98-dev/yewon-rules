"use client";

import React, { useState } from "react";
import { Modal, Box, Typography, TextField, Button, CircularProgress } from "@mui/material";

interface ManualCitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  onSave: (ruleName: string, articleNum: string) => void;
  isSaving: boolean;
}

const modalStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

export default function ManualCitationModal({
  isOpen,
  onClose,
  selectedText,
  onSave,
  isSaving,
}: ManualCitationModalProps) {
  const [ruleName, setRuleName] = useState("");
  const [articleNum, setArticleNum] = useState("");

  // 모달이 열릴 때 초기화
  React.useEffect(() => {
    if (isOpen) {
      setRuleName("");
      setArticleNum("");
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!ruleName.trim() && !articleNum.trim()) {
       alert("규정명 또는 조문 번호를 입력해주세요.");
       return;
    }
    onSave(ruleName.trim(), articleNum.trim());
  };

  return (
    <Modal open={isOpen} onClose={isSaving ? undefined : onClose}>
      <Box sx={modalStyle}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
          수동 인용 연결
        </Typography>
        
        <Box sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
            선택된 텍스트
          </Typography>
          <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
            {selectedText || "(없음)"}
          </Typography>
        </Box>

        <TextField
          fullWidth
          label="연결할 타 규정명 (선택)"
          placeholder="예: 정관, 학칙 (비워두면 현재 규정)"
          value={ruleName}
          onChange={(e) => setRuleName(e.target.value)}
          margin="normal"
          size="small"
        />

        <TextField
          fullWidth
          label="연결할 조문 번호 (선택)"
          placeholder="예: 제10조"
          value={articleNum}
          onChange={(e) => setArticleNum(e.target.value)}
          margin="normal"
          size="small"
        />

        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
          * 현재 조문 내에 있는 동일한 텍스트 중 첫 번째 항목이 지정된 인용 링크로 변환됩니다.
        </Typography>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={onClose} disabled={isSaving} variant="outlined" color="inherit">
            취소
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving} 
            variant="contained" 
            color="primary"
            startIcon={isSaving ? <CircularProgress size={16} /> : null}
          >
            연결 저장
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
