"use client";

import React, { useState, useEffect, useRef } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { IconButton, CircularProgress } from "@mui/material";

interface DraggablePopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  isLoading?: boolean;
  error?: string | null;
  children?: React.ReactNode;
}

export default function DraggablePopup({
  isOpen,
  onClose,
  title,
  isLoading,
  error,
  children,
}: DraggablePopupProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  // 화면 중앙에 초기 위치 지정
  useEffect(() => {
    if (isOpen && popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect();
      const initialX = Math.max(0, (window.innerWidth - rect.width) / 2);
      const initialY = Math.max(0, (window.innerHeight - rect.height) / 2);
      setPosition({ x: initialX, y: initialY });
    }
  }, [isOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      // 화면 밖으로 완전히 나가지 않도록 최소한의 제한을 둘 수 있음
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      className="fixed z-[9999] bg-white rounded-lg shadow-2xl border border-slate-300 flex flex-col overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        width: "500px",
        maxHeight: "80vh",
        minHeight: "150px",
      }}
    >
      {/* Title bar (Draggable Area) */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-slate-100 border-b border-slate-300 cursor-move"
        onMouseDown={handleMouseDown}
      >
        <span className="font-bold text-slate-800 pointer-events-none">{title}</span>
        <IconButton size="small" onClick={onClose} className="hover:bg-slate-200 cursor-pointer">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col bg-white">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <CircularProgress size={32} />
            <p className="mt-4 text-slate-500 text-sm">조문을 불러오는 중입니다...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
            <p className="text-red-500 font-medium">{error}</p>
          </div>
        ) : (
          <div className="flex-1">{children}</div>
        )}
      </div>
    </div>
  );
}
