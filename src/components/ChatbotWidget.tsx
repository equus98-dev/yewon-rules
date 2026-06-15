"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "model";
  content: string;
}

const CuteRobotIcon = ({ width = 24, height = 24, className = "" }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`drop-shadow-sm ${className}`}>
    <path d="M4 11 H2 v4 h2" fill="#e2e8f0" />
    <path d="M20 11 h2 v4 h-2" fill="#e2e8f0" />
    <line x1="12" y1="3" x2="12" y2="6" />
    <circle cx="12" cy="2.5" r="1.5" fill="#f43f5e" stroke="none" />
    <rect x="4" y="6" width="16" height="14" rx="5" fill="#ffffff" />
    <rect x="6" y="9" width="12" height="9" rx="3" fill="#bae6fd" stroke="none" />
    <circle cx="9.5" cy="12.5" r="1.5" fill="#1e293b" stroke="none" />
    <circle cx="14.5" cy="12.5" r="1.5" fill="#1e293b" stroke="none" />
    <path d="M10 15 Q 12 16.5 14 15" strokeWidth="1.2" />
  </svg>
);

export default function ChatbotWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", content: "안녕하세요! 예원예술대학교 규정 AI 어시스턴트입니다. 학칙이나 규정에 대해 궁금한 점을 물어보세요." }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setInput("");
    
    // Add user message to UI immediately
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Send entire conversation history
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(1).map(m => ({ role: m.role, parts: [{ text: m.content }] }))
        }),
      });

      const data = await res.json() as any;

      if (!res.ok) {
        throw new Error(data.reply || data.error || "Failed to fetch response");
      }
      
      setMessages(prev => [...prev, { role: "model", content: data.reply }]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: "model", content: error.message || "죄송합니다. 오류가 발생하여 답변을 생성하지 못했습니다." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && !isDismissed && (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end animate-bounce">
          {/* 동동 떠다니는 안내 말풍선 (직접 디자인한 Q&A 아이콘) */}
          <div className="relative mb-1 mr-2 flex flex-col items-center drop-shadow-lg cursor-pointer group" onClick={() => setIsOpen(true)}>
            {/* 닫기 버튼 */}
            <button 
              onClick={(e) => { e.stopPropagation(); setIsDismissed(true); }}
              className="absolute -top-3 -right-3 z-30 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100 shrink-0 bg-white/60 backdrop-blur-md shadow-sm"
              aria-label="챗봇 숨기기"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            
            {/* 직접 디자인한 Q/A 아이콘 */}
            <div className="relative w-[44px] h-[38px] transition-transform group-hover:scale-105">
              {/* Q 말풍선 (뒤쪽, 왼쪽 위) */}
              <div className="absolute top-0 left-0 w-[28px] h-[26px] bg-gradient-to-b from-[#ff6b6b] to-[#ee5253] rounded-[10px] rounded-bl-[3px] shadow flex items-center justify-center z-10 border border-[#ff9f43]/30">
                <span className="text-white font-black text-[14px] leading-none pr-[1px] pb-[1px]" style={{ textShadow: '0 1px 2px rgba(238,82,83,0.5)' }}>Q</span>
              </div>
              {/* A 말풍선 (앞쪽, 오른쪽 아래) */}
              <div className="absolute bottom-0 right-0 w-[30px] h-[28px] bg-gradient-to-b from-[#48dbfb] to-[#0abde3] rounded-[11px] rounded-br-[3px] shadow-md flex items-center justify-center z-20 border border-[#48dbfb]/40">
                <span className="text-white font-black text-[16px] leading-none pr-[1px] pb-[1px]" style={{ textShadow: '0 1px 2px rgba(10,189,227,0.5)' }}>A</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 bg-gradient-to-tr from-[#0c3161] via-[#009b9e] to-[#eab308] hover:opacity-90 text-white rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110"
            aria-label="챗봇 열기"
          >
            <CuteRobotIcon width={32} height={32} />
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[380px] h-[550px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border border-slate-200 animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0c3161] to-[#009b9e] border-b-[3px] border-[#ffd54f] text-white p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <CuteRobotIcon width={20} height={20} />
              <h3 className="font-bold text-[16px]">예원예대 규정 AI</h3>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-slate-200 transition-colors"
              aria-label="챗봇 닫기"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 flex flex-col gap-4">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3 max-w-[90%] ${msg.role === "user" ? "self-end flex-row-reverse" : "self-start"}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === "user" ? "bg-slate-200 text-slate-600" : "bg-gradient-to-br from-[#0c3161] to-[#009b9e] text-white shadow-sm"}`}>
                  {msg.role === "user" ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> : <CuteRobotIcon width={18} height={18} />}
                </div>
                <div className={`p-3 rounded-2xl text-[14px] leading-relaxed shadow-sm prose prose-sm max-w-none ${
                  msg.role === "user" 
                    ? "bg-gradient-to-br from-[#0c3161] to-[#009b9e] text-white rounded-tr-sm prose-p:text-white prose-a:text-yellow-200" 
                    : "bg-white text-slate-800 rounded-tl-sm border border-slate-100 prose-p:m-0 prose-ul:my-1 prose-li:my-0 prose-a:text-[#009b9e]"
                }`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 max-w-[85%] self-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0c3161] to-[#009b9e] text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                  <CuteRobotIcon width={18} height={18} />
                </div>
                <div className="p-4 bg-white rounded-2xl rounded-tl-sm border border-slate-100 shadow-sm flex gap-1 items-center">
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100 shrink-0">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 focus-within:border-[#009b9e] focus-within:ring-1 focus-within:ring-[#009b9e] transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="규정에 대해 질문해보세요..."
                className="flex-1 bg-transparent outline-none text-[14px] text-slate-800 placeholder-slate-400"
                disabled={isLoading}
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="text-[#009b9e] hover:text-[#0c3161] disabled:text-slate-300 transition-colors"
                aria-label="보내기"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </div>
            <div className="text-center mt-2 text-[10px] text-slate-400">
              AI가 생성한 답변이므로 정확한 규정은 원본을 확인하시기 바랍니다.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
