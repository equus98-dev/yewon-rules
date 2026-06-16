"use client";

import React, { useState, useEffect, useRef } from "react";
import { CircularProgress } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RuleViewer from "./RuleViewer";

interface TwoColumnViewerProps {
  currentRuleId: string;
}

export default function TwoColumnViewer({ currentRuleId }: TwoColumnViewerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [rightRuleId, setRightRuleId] = useState<string | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/rules/search?query=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json() as any;
        setSearchResults(data.titleMatches || []);
        setShowDropdown(true);
      }
    } catch (e) {
      console.error("Failed to search rules", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectRule = (ruleId: string) => {
    setRightRuleId(ruleId);
    setShowDropdown(false);
    setSearchQuery("");
  };

  return (
    <div className="flex-1 flex overflow-hidden w-full relative bg-slate-200">
      {/* Left Column - Current Rule */}
      <div className="flex-1 relative flex flex-col min-w-0 border-r-4 border-slate-300">
        <RuleViewer ruleId={currentRuleId} />
      </div>

      {/* Right Column - Selected Rule or Search */}
      <div className="flex-1 relative flex flex-col min-w-0 bg-white">
        {/* Search Bar Header */}
        <div className="h-14 bg-slate-50 border-b border-slate-200 flex items-center px-4 relative z-50">
          <div className="relative flex-1 max-w-lg mx-auto" ref={searchRef}>
            <div className="flex items-center bg-white border border-slate-300 rounded overflow-hidden shadow-sm">
              <div className="pl-3 pr-2 text-slate-400">
                <SearchIcon fontSize="small" />
              </div>
              <input
                type="text"
                placeholder="우측에 비교할 규정을 검색하세요..."
                className="w-full py-1.5 px-2 text-sm outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowDropdown(true);
                }}
              />
              {isSearching && <CircularProgress size={16} className="mx-3" />}
            </div>

            {/* Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-[400px] overflow-y-auto">
                <ul className="divide-y divide-slate-100">
                  {searchResults.map((rule) => (
                    <li
                      key={rule.id}
                      className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => handleSelectRule(rule.id)}
                    >
                      <div className="font-bold text-[13px] text-slate-800">{rule.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {rule.categoryName} {rule.departmentName ? `| ${rule.departmentName}` : ""} | 제{rule.ruleNumber}호
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {showDropdown && searchResults.length === 0 && searchQuery && !isSearching && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded shadow-lg p-4 text-center text-sm text-slate-500">
                검색 결과가 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative flex flex-col min-h-0 overflow-hidden">
          {rightRuleId ? (
            <RuleViewer ruleId={rightRuleId} />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400">
              <SearchIcon sx={{ fontSize: 64, color: "#cbd5e1" }} className="mb-4" />
              <h3 className="text-xl font-bold mb-2">비교할 규정을 선택해주세요</h3>
              <p className="text-sm">상단 검색창에서 다른 규정을 검색하여 우측 화면에 불러옵니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
