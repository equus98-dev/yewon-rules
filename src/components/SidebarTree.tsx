"use client";

import React, { useState, useEffect } from "react";
import { Tabs, Tab, Box, TextField, CircularProgress, Typography, Dialog } from "@mui/material";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import FolderIcon from "@mui/icons-material/Folder";
import ArticleIcon from "@mui/icons-material/Article";
import SearchIcon from "@mui/icons-material/Search";

// 수직 네비게이션을 위한 아이콘들 임포트
import MenuBookIcon from "@mui/icons-material/MenuBook";
import HistoryIcon from "@mui/icons-material/History";
import DescriptionIcon from "@mui/icons-material/Description";
import CampaignIcon from "@mui/icons-material/Campaign";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AccountTreeIcon from "@mui/icons-material/AccountTree";

interface TreeNode {
  id: string;
  name: string;
  type: "folder" | "file";
  status?: "EFFECTIVE" | "ABOLISHED";
  children?: TreeNode[];
}

interface SidebarTreeProps {
  onSelectRule: (ruleId: string) => void;
  onSelectCategory?: (categoryId: string, categoryName: string) => void;
  onTabChange?: (tab: string) => void;
  activeRuleId?: string | null;
  onSelectNotice?: (noticeId: string) => void;
}

const ClosedIcon = () => (
  <span className="text-[10px] text-slate-400 font-bold select-none mr-0.5">▷</span>
);
const OpenedIcon = () => (
  <span className="text-[10px] text-slate-500 font-bold select-none mr-0.5">▼</span>
);

export default function SidebarTree({ activeRuleId, onSelectRule, onSelectCategory, onTabChange, onSelectNotice }: SidebarTreeProps) {
  // 1단 세로 메뉴 탭 상태: "규정" | "최신 제·개정" | "서식" | "공지사항" | "조직도"
  const [verticalTab, setVerticalTab] = useState<"규정" | "최신 제·개정" | "서식" | "공지사항" | "조직도">("규정");

  // 조직도 모달 상태
  const [orgChartOpen, setOrgChartOpen] = useState(false);

  // 규정 탭 내부 상태
  const [tabIndex, setTabIndex] = useState(0); // 0: 분야별, 1: 소관부서별, 2: 가나다순
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // 최신 제·개정 탭 상태
  const [recentRules, setRecentRules] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // 서식 탭 상태
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [searchAttachmentTerm, setSearchAttachmentTerm] = useState("");

  // 실시간 공지사항 탭 상태 추가
  const [notices, setNotices] = useState<any[]>([]);
  const [loadingNotices, setLoadingNotices] = useState(false);

  // 에러 팝업 상태
  const [errorPopup, setErrorPopup] = useState<string | null>(null);

  const tabTypes = ["field", "dept", "abc"];

  // 1. 규정 대분류 트리 데이터 패치
  useEffect(() => {
    async function fetchTreeData() {
      setLoading(true);
      try {
        const type = tabTypes[tabIndex];
        const res = await fetch(`/api/categories?type=${type}`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`API Error: [${res.status}] ${text}`);
        }
        const data = (await res.json()) as any;
        if (Array.isArray(data)) {
          setTreeData(data);
        } else {
          setTreeData([]);
        }
      } catch (error: any) {
        console.error("Failed to load tree data:", error);
        setErrorPopup(error.message || "Failed to load categories");
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
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`API Error: [${res.status}] ${text}`);
        }
        const data = (await res.json()) as any;
        if (Array.isArray(data)) {
          // 공포일자(enactmentDate) 내림차순 정렬
          const sorted = data.sort(
            (a: any, b: any) => new Date(b.enactmentDate).getTime() - new Date(a.enactmentDate).getTime()
          );
          setRecentRules(sorted);
        }
      } catch (err: any) {
        console.error("Failed to fetch recent rules:", err);
        setErrorPopup(err.message || "Failed to load recent rules");
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
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`API Error: [${res.status}] ${text}`);
        }
        const data = (await res.json()) as any;
        if (Array.isArray(data)) {
          setAttachments(data);
        }
      } catch (err: any) {
        console.error("Failed to fetch attachments:", err);
        setErrorPopup(err.message || "Failed to load attachments");
      } finally {
        setLoadingAttachments(false);
      }
    }
    if (verticalTab === "서식" && attachments.length === 0) {
      loadAttachments();
    }
  }, [verticalTab, attachments.length]);

  // 4. 공지사항 실시간 패치
  useEffect(() => {
    async function loadNotices() {
      setLoadingNotices(true);
      try {
        const res = await fetch("/api/notices");
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`API Error: [${res.status}] ${text}`);
        }
        const data = (await res.json()) as any;
        if (Array.isArray(data)) {
          setNotices(data);
        }
      } catch (err: any) {
        console.error("Failed to fetch notices:", err);
        setErrorPopup(err.message || "Failed to load notices");
      } finally {
        setLoadingNotices(false);
      }
    }
    if (verticalTab === "공지사항" && notices.length === 0) {
      loadNotices();
    }
  }, [verticalTab, notices.length]);

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

  // 검색어 입력 시 폴더 자동 전개
  useEffect(() => {
    if (searchTerm.trim() !== "") {
      const ids: string[] = [];
      const extractIds = (nodes: TreeNode[]) => {
        nodes.forEach((n) => {
          if (n.type === "folder") {
            ids.push(n.id);
            if (n.children) extractIds(n.children);
          }
        });
      };
      extractIds(displayData);
      setExpandedItems(ids);
    } else {
      // 검색어가 없으면 모두 접기
      setExpandedItems([]);
    }
  }, [searchTerm, displayData]);

  // 재귀적 트리 아이템 렌더러
  const renderTreeItems = (nodes: TreeNode[]) => {
    return nodes.map((node) => {
      const isFile = node.type === "file";

      // 아이콘 매칭: 폴더 색상을 남서울대 스타일의 cool slate-blue(#5d7a8c)로 맵핑
      const icon = isFile ? (
        <ArticleIcon className="text-slate-400 text-[18px] shrink-0" />
      ) : (
        <FolderIcon className="text-[#5d7a8c] text-[18px] shrink-0" />
      );

      // 폐지 규정은 흐리게 및 취소선 표시
      const labelStyle = node.status === "ABOLISHED" ? "line-through text-slate-400" : "";
      const textStyle = isFile 
        ? "text-[14.5px] font-medium text-slate-800 tracking-tight" 
        : "text-[14.5px] font-bold text-slate-700";

      return (
        <TreeItem
          key={node.id}
          itemId={node.id}
          label={
            <div className="flex items-center gap-1.5 py-1 select-none overflow-hidden">
              {icon}
              <span className={`${textStyle} leading-relaxed truncate ${labelStyle}`}>{node.name}</span>
            </div>
          }
          onClick={(e) => {
            e.stopPropagation();
            if (isFile) {
              onSelectRule(node.id);
            } else {
              if (onSelectCategory) {
                onSelectCategory(node.id.replace("cat-", ""), node.name);
              }
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

  // 서식 검색 필터링
  const filteredAttachments = attachments.filter((att) =>
    (att.title && att.title.toLowerCase().includes(searchAttachmentTerm.toLowerCase())) ||
    (att.ruleTitle && att.ruleTitle.toLowerCase().includes(searchAttachmentTerm.toLowerCase()))
  );

  // 1단 세로바 아이템 정보
  const verticalMenuItems = [
    { id: "규정" as const, label: "규정", icon: <MenuBookIcon sx={{ fontSize: 26 }} /> },
    { id: "최신 제·개정" as const, label: <React.Fragment>최신<br/>제개정</React.Fragment>, icon: <HistoryIcon sx={{ fontSize: 26 }} /> },
    { id: "서식" as const, label: "서식", icon: <DescriptionIcon sx={{ fontSize: 26 }} /> },
    { id: "공지사항" as const, label: "공지", icon: <CampaignIcon sx={{ fontSize: 26 }} /> },
    { id: "조직도" as const, label: "조직도", icon: <AccountTreeIcon sx={{ fontSize: 26 }} /> },
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
              onClick={() => {
                setVerticalTab(item.id);
                if (onTabChange) onTabChange(item.id);
              }}
              className={`w-16 min-h-[64px] flex flex-col items-center justify-center gap-1.5 rounded-xl py-2 cursor-pointer transition-all duration-200 active:scale-95 ${
                isActive
                  ? "bg-white text-[#0c3161] font-bold shadow-md"
                  : "text-blue-100 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.icon}
              <span className="text-[13px] font-extrabold tracking-tight text-center leading-[1.15]">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==================== 2단계: 카테고리 & 데이터 이너 패널 ==================== */}
      <div className="flex-1 h-full flex flex-col overflow-hidden bg-white">
        
        {/* 이너 패널 헤더 */}
        <div className={`h-14 border-b border-slate-200 flex items-center justify-center px-4 shrink-0 select-none relative overflow-hidden ${verticalTab === '규정' ? 'text-white' : 'bg-slate-50 text-slate-800'}`}>
          {verticalTab === '규정' && (
            <>
              <div className="absolute inset-0 bg-[#009b9e]/90 mix-blend-multiply z-10" />
              <img src="/yewon2.jpeg" alt="background" className="absolute inset-0 w-full h-full object-cover opacity-50 z-0" />
            </>
          )}
          <h2 className="text-[18px] font-black tracking-tight text-center relative z-20 drop-shadow-md">
            {verticalTab === "규정" ? "규정목록" : verticalTab}
          </h2>
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
                    fontSize: "0.875rem",
                    fontWeight: "bold",
                  }
                }}
              >
                <Tab label="규정별" />
                <Tab label="부서별" />
                <Tab label="가나다별" />
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
                    fontSize: "0.85rem",
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
                  selectedItems={activeRuleId || null}
                  expandedItems={expandedItems}
                  onExpandedItemsChange={(_e, itemIds) => setExpandedItems(itemIds as string[])}
                  slots={{
                    expandIcon: ClosedIcon,
                    collapseIcon: OpenedIcon,
                  }}
                  sx={{
                    "& .MuiTreeItem-groupTransition": {
                      marginLeft: "12px",
                      paddingLeft: "8px",
                      borderLeft: "1px dashed #cbd5e1"
                    },
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
                      <span className="bg-blue-50 text-blue-800 px-1 py-0.5 rounded text-[10px] font-bold">
                        {rule.departmentName}
                      </span>
                      <span className="text-[10.5px] text-slate-400">
                        {new Date(rule.enactmentDate).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-800 text-[12.5px] line-clamp-1 mt-0.5">
                      {rule.title}
                    </h4>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
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
                    fontSize: "0.85rem",
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
                      href={att.fileUrl.startsWith('http') ? `${att.fileUrl}?download=${encodeURIComponent(att.title + '.hwp')}` : `/api/download?fileUrl=${encodeURIComponent(att.fileUrl)}`}
                      download={att.fileUrl.startsWith('http') ? undefined : true}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full p-2.5 rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50/30 transition-all flex items-start gap-2.5 cursor-pointer text-left"
                    >
                      <span className={`w-8 h-8 rounded shrink-0 flex items-center justify-center font-black text-[10.5px] uppercase ${typeBg}`}>
                        {att.fileType || "FIL"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-slate-800 text-[12.5px] truncate" title={att.title}>
                          {att.title}
                        </h4>
                        <p className="text-[10.5px] text-slate-400 mt-0.5 truncate">
                          규정: {att.ruleTitle || "미지정"}
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
        {verticalTab === "공지사항" && (
          <div className="flex-1 overflow-y-auto p-2.5 scrollbar flex flex-col gap-2 bg-slate-50/30">
            {loadingNotices ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2">
                <CircularProgress size={20} />
                <span className="text-[10px] text-slate-400">공지 로드 중...</span>
              </div>
            ) : notices.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-xs font-bold">
                등록된 공지사항이 없습니다.
              </div>
            ) : (
              notices.map((notice: any) => (
                <div
                  key={notice.id}
                  onClick={() => {
                    if (onSelectNotice) {
                      onSelectNotice(notice.id);
                    }
                  }}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-[#0c3161]/5 hover:border-blue-300 transition-all text-xs flex flex-col gap-1 shadow-sm cursor-pointer active:scale-98"
                >
                  <div className="flex items-center justify-between text-[10.5px] text-slate-400">
                    <span className="font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 text-[10px]">
                      {notice.dept}
                    </span>
                    <span>{notice.date}</span>
                  </div>
                  <h4 className="font-extrabold text-slate-700 text-[12.5px] mt-1 leading-snug line-clamp-2">
                    {notice.title}
                  </h4>
                </div>
              ))
            )}
          </div>
        )}

        {/* 2-5) 조직도 패널 */}
        {verticalTab === "조직도" && (
          <div className="flex-1 overflow-y-auto p-4 flex items-start justify-center bg-slate-50/30">
            <div 
              onClick={() => setOrgChartOpen(true)} 
              className="cursor-pointer block w-full hover:opacity-90 transition-opacity" 
              title="크게 보기"
            >
              <img 
                src="/docs/1.jpg" 
                alt="조직도" 
                className="w-full h-auto object-contain shadow-sm border border-slate-200 rounded-md"
              />
            </div>
          </div>
        )}

        <Dialog 
          open={orgChartOpen} 
          onClose={() => setOrgChartOpen(false)} 
          maxWidth="lg" 
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              bgcolor: 'transparent',
              boxShadow: 'none',
              m: 2,
              maxHeight: '90vh'
            }
          }}
        >
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <button 
              onClick={() => setOrgChartOpen(false)}
              className="absolute -top-4 -right-4 bg-white text-slate-800 hover:bg-slate-100 rounded-full w-10 h-10 flex items-center justify-center shadow-lg z-50 text-xl font-bold border border-slate-200"
            >
              ✕
            </button>
            <img 
              src="/docs/1.jpg" 
              alt="조직도 크게 보기" 
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl shadow-2xl bg-white"
            />
          </div>
        </Dialog>

        {/* 에러 팝업 모달 */}
        <Dialog 
          open={!!errorPopup} 
          onClose={() => setErrorPopup(null)} 
          maxWidth="sm" 
          fullWidth
        >
          <div className="p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-red-600">데이터를 불러오는 중 오류가 발생했습니다.</h3>
            <p className="text-sm text-slate-700 font-mono whitespace-pre-wrap bg-slate-100 p-4 rounded-md overflow-x-auto max-h-64 overflow-y-auto">
              {errorPopup}
            </p>
            <div className="flex justify-end mt-2">
              <button
                onClick={() => setErrorPopup(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-md text-sm font-bold hover:bg-slate-700"
              >
                닫기
              </button>
            </div>
          </div>
        </Dialog>

      </div>
    </div>
  );
}
