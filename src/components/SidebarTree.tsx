"use client";

import React, { useState, useEffect } from "react";
import { Tabs, Tab, Box, TextField, CircularProgress, Typography } from "@mui/material";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import FolderIcon from "@mui/icons-material/Folder";
import GavelIcon from "@mui/icons-material/Gavel";
import SearchIcon from "@mui/icons-material/Search";

// 수직 네비게이션을 위한 아이콘들 임포트
import MenuBookIcon from "@mui/icons-material/MenuBook";
import HistoryIcon from "@mui/icons-material/History";
import DescriptionIcon from "@mui/icons-material/Description";
import CampaignIcon from "@mui/icons-material/Campaign";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

interface TreeNode {
  id: string;
  name: string;
  type: "folder" | "file";
  status?: "EFFECTIVE" | "ABOLISHED";
  children?: TreeNode[];
}

interface SidebarTreeProps {
  onSelectRule: (ruleId: string) => void;
  activeRuleId?: string | null;
}

const ClosedIcon = () => (
  <span className="text-[10px] text-slate-400 font-bold select-none mr-0.5">▷</span>
);
const OpenedIcon = () => (
  <span className="text-[10px] text-slate-500 font-bold select-none mr-0.5">▼</span>
);

export default function SidebarTree({ onSelectRule, activeRuleId }: SidebarTreeProps) {
  // 1단 수직 메뉴 바 인덱스/상태: "규정" | "최신 제·개정" | "서식" | "공지"
  const [verticalTab, setVerticalTab] = useState<"규정" | "최신 제·개정" | "서식" | "공지">("규정");

  // 규정 탭 내부 상태
  const [tabIndex, setTabIndex] = useState(0); // 0: 분야별, 1: 소관부서별, 2: 가나다순
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 최신 제·개정 탭 상태
  const [recentRules, setRecentRules] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // 서식 탭 상태
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [searchAttachmentTerm, setSearchAttachmentTerm] = useState("");

  const tabTypes = ["field", "dept", "abc"];

  // 1. 규정 대분류 트리 데이터 패치
  useEffect(() => {
    async function fetchTreeData() {
      setLoading(true);
      try {
        const type = tabTypes[tabIndex];
        const res = await fetch(`/api/categories?type=${type}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setTreeData(data);
        } else {
          setTreeData([]);
        }
      } catch (error) {
        console.error("Failed to load tree data:", error);
        setTreeData([]);
      } finally {
        setLoading(false);
      }
    }
    if (verticalTab === "규정") {
      fetchTreeData();
    }
  }, [tabIndex, verticalTab]);

  // 2. 최신 제·개정 피드 패치
  useEffect(() => {
    async function loadRecent() {
      setLoadingRecent(true);
      try {
        const res = await fetch("/api/rules/search?query=");
        const data = await res.json();
        if (Array.isArray(data)) {
          // 공포일자(enactmentDate) 내림차순 정렬
          const sorted = data.sort(
            (a: any, b: any) => new Date(b.enactmentDate).getTime() - new Date(a.enactmentDate).getTime()
          );
          setRecentRules(sorted);
        }
      } catch (err) {
        console.error("Failed to fetch recent rules:", err);
      } finally {
        setLoadingRecent(false);
      }
    }
    if (verticalTab === "최신 제·개정" && recentRules.length === 0) {
      loadRecent();
    }
  }, [verticalTab, recentRules.length]);

  // 3. 전체 서식(첨부파일) 패치
  useEffect(() => {
    async function loadAttachments() {
      setLoadingAttachments(true);
      try {
        const res = await fetch("/api/attachments");
        const data = await res.json();
        if (Array.isArray(data)) {
          setAttachments(data);
        }
      } catch (err) {
        console.error("Failed to fetch attachments:", err);
      } finally {
        setLoadingAttachments(false);
      }
    }
    if (verticalTab === "서식" && attachments.length === 0) {
      loadAttachments();
    }
  }, [verticalTab, attachments.length]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
    setSearchTerm(""); // 탭 전환 시 검색어 초기화
  };

  // 트리의 텍스트 필터 검색
  const filterTree = (nodes: TreeNode[], term: string): TreeNode[] => {
    if (!term) return nodes;

    return nodes
      .map((node) => {
        if (node.type === "file") {
          return node.name.toLowerCase().includes(term.toLowerCase()) ? node : null;
        }

        // 폴더 노드의 경우 하위 자식을 필터
        const filteredChildren = filterTree(node.children || [], term);
        if (filteredChildren.length > 0 || node.name.toLowerCase().includes(term.toLowerCase())) {
          return {
            ...node,
            children: filteredChildren,
          };
        }
        return null;
      })
      .filter((node): node is TreeNode => node !== null);
  };

  const displayData = filterTree(treeData, searchTerm);

  // 재귀적 트리 아이템 렌더러
  const renderTreeItems = (nodes: TreeNode[]) => {
    return nodes.map((node) => {
      const isFile = node.type === "file";

      // 아이콘 매칭: 폴더 색상을 남서울대 스타일의 cool slate-blue(#5d7a8c)로 맵핑
      const icon = isFile ? (
        <GavelIcon className="text-blue-700 text-xs shrink-0" />
      ) : (
        <FolderIcon className="text-[#5d7a8c] text-[16px] shrink-0" />
      );

      // 폐지 규정은 흐리게 및 취소선 표시
      const labelStyle = node.status === "ABOLISHED" ? "line-through text-slate-400" : "";

      return (
        <TreeItem
          key={node.id}
          itemId={node.id}
          label={
            <div className="flex items-center gap-1.5 py-0.5 select-none overflow-hidden">
              {icon}
              <span className={`text-[12px] font-semibold text-slate-700 leading-relaxed truncate ${labelStyle}`}>{node.name}</span>
            </div>
          }
          onClick={() => {
            if (isFile) {
              onSelectRule(node.id);
            }
          }}
        >
          {Array.isArray(node.children) && node.children.length > 0
            ? renderTreeItems(node.children)
            : null}
        </TreeItem>
      );
    });
  };

  // 더미 공지사항 목록
  const dummyNotices = [
    { id: 1, title: "2026학년도 제1학기 대학평의원회 규정 심의 결과 안내", date: "2026.05.20", dept: "기획처" },
    { id: 2, title: "[공고] 학칙 및 학사행정규정 일부 개정 안 예고 수렴", date: "2026.05.14", dept: "교무처" },
    { id: 3, title: "예원예술대학교 요람 및 규정집 편찬위원회 발족식 개최", date: "2026.05.02", dept: "총무처" },
    { id: 4, title: "정부 재정지원 제한 평가 대비 정관 개정 완료 공지", date: "2026.04.28", dept: "기획처" },
    { id: 5, title: "규정관리시스템 리뉴얼(남서울대 벤치마킹) 오픈 안내", date: "2026.04.15", dept: "전산정보원" },
  ];

  // 서식 검색 필터링
  const filteredAttachments = attachments.filter((att) =>
    att.title.toLowerCase().includes(searchAttachmentTerm.toLowerCase()) ||
    att.rule.title.toLowerCase().includes(searchAttachmentTerm.toLowerCase())
  );

  // 1단 세로바 아이템 정보
  const verticalMenuItems = [
    { id: "규정" as const, label: "규정", icon: <MenuBookIcon sx={{ fontSize: 22 }} /> },
    { id: "최신 제·개정" as const, label: "최신 제·개정", icon: <HistoryIcon sx={{ fontSize: 22 }} /> },
    { id: "서식" as const, label: "서식", icon: <DescriptionIcon sx={{ fontSize: 22 }} /> },
    { id: "공지" as const, label: "공지", icon: <CampaignIcon sx={{ fontSize: 22 }} /> },
  ];

  return (
    <div className="h-full w-full bg-white border-r border-slate-200 flex overflow-hidden">
      
      {/* ==================== 1단계: 세로형 아이콘 메뉴바 ==================== */}
      <div className="w-[75px] bg-[#0c3161] flex flex-col items-center py-6 gap-5 shrink-0 text-white shadow-inner z-10">
        {verticalMenuItems.map((item) => {
          const isActive = verticalTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setVerticalTab(item.id)}
              className={`w-14 h-14 flex flex-col items-center justify-center gap-1 rounded-xl cursor-pointer transition-all duration-200 active:scale-95 ${
                isActive
                  ? "bg-white text-[#0c3161] font-bold shadow-md"
                  : "text-blue-100 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.icon}
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==================== 2단계: 카테고리 & 데이터 이너 패널 ==================== */}
      <div className="flex-1 h-full flex flex-col overflow-hidden bg-white">
        
        {/* 이너 패널 헤더 */}
        <div className="h-14 border-b border-slate-200 flex items-center px-4 shrink-0 bg-slate-50">
          <h2 className="text-sm font-black text-slate-800 tracking-tight">{verticalTab}</h2>
        </div>

        {/* 2-1) 규정 탭 패널 */}
        {verticalTab === "규정" && (
          <>
            {/* 분야별/소관부서별/가나다순 탭 */}
            <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "slate.50" }}>
              <Tabs
                value={tabIndex}
                onChange={handleTabChange}
                variant="fullWidth"
                indicatorColor="primary"
                textColor="primary"
                aria-label="규정 분류 탭"
                sx={{
                  minHeight: "36px",
                  "& .MuiTab-root": {
                    minHeight: "36px",
                    py: 0.5,
                    fontSize: "0.775rem",
                    fontWeight: "bold",
                  }
                }}
              >
                <Tab label="분야" />
                <Tab label="부서" />
                <Tab label="가나다" />
              </Tabs>
            </Box>

            {/* 내부 트리 규정 검색창 */}
            <div className="p-2 border-b border-slate-100 bg-slate-50/50">
              <TextField
                fullWidth
                size="small"
                placeholder="메뉴 내 규정 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: <SearchIcon className="text-slate-400 mr-1 text-sm" />,
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "white",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    height: "32px",
                  },
                }}
              />
            </div>

            {/* 트리뷰 컨테이너 */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2">
                  <CircularProgress size={20} />
                  <Typography variant="caption" color="textSecondary" className="text-[10px]">
                    목록 로드중...
                  </Typography>
                </div>
              ) : displayData.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-slate-400 text-[11px]">
                  검색 결과에 맞는 규정이 없습니다.
                </div>
              ) : (
                <SimpleTreeView
                  selectedItems={activeRuleId ? activeRuleId : undefined}
                  slots={{
                    expandIcon: ClosedIcon,
                    collapseIcon: OpenedIcon,
                  }}
                  sx={{
                    "& .MuiTreeItem-content": {
                      borderRadius: "4px",
                      margin: "0.5px 0",
                      padding: "2.5px 5px",
                      "&:hover": {
                        bgcolor: "slate.50",
                      },
                      "&.Mui-selected": {
                        bgcolor: "#eff6ff",
                        color: "#1e3a8a",
                        fontWeight: "bold",
                        "&:hover": {
                          bgcolor: "#dbeafe",
                        },
                      },
                    },
                  }}
                >
                  {renderTreeItems(displayData)}
                </SimpleTreeView>
              )}
            </div>
          </>
        )}

        {/* 2-2) 최신 제·개정 패널 */}
        {verticalTab === "최신 제·개정" && (
          <div className="flex-1 overflow-y-auto p-2.5 scrollbar flex flex-col gap-2 bg-slate-50/30">
            {loadingRecent ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2">
                <CircularProgress size={20} />
                <span className="text-[10px] text-slate-400">최신 연혁 읽는 중...</span>
              </div>
            ) : recentRules.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-xs">
                최근 제·개정 규정이 없습니다.
              </div>
            ) : (
              recentRules.map((rule) => {
                const isSelected = activeRuleId === rule.id;
                return (
                  <button
                    key={rule.id}
                    onClick={() => onSelectRule(rule.id)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs flex flex-col gap-1 cursor-pointer bg-white ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/40 shadow-sm"
                        : "border-slate-200 hover:border-blue-300 hover:bg-slate-50/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="bg-blue-50 text-blue-800 px-1 py-0.5 rounded text-[9px] font-bold">
                        {rule.departmentName}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {new Date(rule.enactmentDate).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-800 text-[11px] line-clamp-1 mt-0.5">
                      {rule.title}
                    </h4>
                    <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1">
                      <span>공포번호: {rule.announcementNumber || "미지정"}</span>
                      <span className="text-blue-700 font-bold">{rule.latestVersionName}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* 2-3) 관련 서식 패널 */}
        {verticalTab === "서식" && (
          <>
            {/* 서식 필터 검색창 */}
            <div className="p-2 border-b border-slate-100 bg-slate-50/50">
              <TextField
                fullWidth
                size="small"
                placeholder="서식명 또는 규정명 검색..."
                value={searchAttachmentTerm}
                onChange={(e) => setSearchAttachmentTerm(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: <SearchIcon className="text-slate-400 mr-1 text-xs" />,
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "white",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    height: "32px",
                  },
                }}
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 scrollbar flex flex-col gap-2 bg-slate-50/30">
              {loadingAttachments ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2">
                  <CircularProgress size={20} />
                  <span className="text-[10px] text-slate-400">서식 목록 로드중...</span>
                </div>
              ) : filteredAttachments.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-slate-400 text-xs">
                  검색 결과에 맞는 서식이 없습니다.
                </div>
              ) : (
                filteredAttachments.map((att) => {
                  const isHwp = att.fileType?.toLowerCase() === "hwp";
                  const isPdf = att.fileType?.toLowerCase() === "pdf";
                  let typeBg = "bg-slate-100 text-slate-600 border border-slate-200";
                  if (isHwp) typeBg = "bg-rose-50 text-rose-700 border border-rose-100";
                  if (isPdf) typeBg = "bg-red-50 text-red-700 border border-red-100";

                  return (
                    <a
                      key={att.id}
                      href={att.fileUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full p-2.5 rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50/30 transition-all flex items-start gap-2.5 cursor-pointer text-left"
                    >
                      <span className={`w-8 h-8 rounded shrink-0 flex items-center justify-center font-black text-[9px] uppercase ${typeBg}`}>
                        {att.fileType || "FIL"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-slate-800 text-[11px] truncate" title={att.title}>
                          {att.title}
                        </h4>
                        <p className="text-[9px] text-slate-400 mt-0.5 truncate">
                          규정: {att.rule.title}
                        </p>
                      </div>
                      <FileDownloadIcon className="text-slate-300 hover:text-blue-700 text-sm shrink-0 self-center" />
                    </a>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* 2-4) 공지사항 패널 */}
        {verticalTab === "공지" && (
          <div className="flex-1 overflow-y-auto p-2.5 scrollbar flex flex-col gap-2 bg-slate-50/30">
            {dummyNotices.map((notice) => (
              <div
                key={notice.id}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50/30 transition-all text-xs flex flex-col gap-1 shadow-sm"
              >
                <div className="flex items-center justify-between text-[9px] text-slate-400">
                  <span className="font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                    {notice.dept}
                  </span>
                  <span>{notice.date}</span>
                </div>
                <h4 className="font-extrabold text-slate-700 text-[11px] mt-1 leading-snug line-clamp-2">
                  {notice.title}
                </h4>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
