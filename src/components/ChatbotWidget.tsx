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
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="4" x2="12" y2="6" />
    <circle cx="12" cy="3" r="1" fill="currentColor" stroke="currentColor" />
    <rect x="5" y="6" width="14" height="12" rx="4" />
    <circle cx="9" cy="11" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="15" cy="11" r="1.5" fill="currentColor" stroke="none" />
    <path d="M9 14.5 Q 12 17 15 14.5" />
    <path d="M5 10 H3 a1 1 0 0 0 -1 1 v2 a1 1 0 0 0 1 1 h2" />
    <path d="M19 10 h2 a1 1 0 0 1 1 1 v2 a1 1 0 0 1 -1 1 h-2" />
  </svg>
);

export default function ChatbotWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
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
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-[#000080] hover:bg-[#000060] text-white rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110 z-50 animate-bounce group"
          aria-label="챗봇 열기"
        >
          <CuteRobotIcon width={32} height={32} />
          <span className="absolute -top-10 right-0 bg-white text-slate-800 text-sm font-bold px-3 py-1.5 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            AI 규정 어시스턴트
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[380px] h-[550px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border border-slate-200 animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-[#000080] text-white p-4 flex justify-between items-center shrink-0">
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
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === "user" ? "bg-slate-200 text-slate-600" : "bg-[#000080] text-white"}`}>
                  {msg.role === "user" ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> : <CuteRobotIcon width={18} height={18} />}
                </div>
                <div className={`p-3 rounded-2xl text-[14px] leading-relaxed shadow-sm prose prose-sm max-w-none ${
                  msg.role === "user" 
                    ? "bg-[#000080] text-white rounded-tr-sm prose-p:text-white prose-a:text-sky-200" 
                    : "bg-white text-slate-800 rounded-tl-sm border border-slate-100 prose-p:m-0 prose-ul:my-1 prose-li:my-0 prose-a:text-[#000080]"
                }`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 max-w-[85%] self-start">
                <div className="w-8 h-8 rounded-full bg-[#000080] text-white flex items-center justify-center shrink-0 mt-1">
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
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 focus-within:border-[#000080] focus-within:ring-1 focus-within:ring-[#000080] transition-all">
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
                className="text-[#000080] disabled:text-slate-300 transition-colors"
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
