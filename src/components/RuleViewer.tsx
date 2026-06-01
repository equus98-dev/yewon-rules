"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Tabs, Tab, Box, CircularProgress, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from "@mui/material";
import ArticleRenderer from "./ArticleRenderer";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import HistoryIcon from "@mui/icons-material/History";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import ArticleIcon from "@mui/icons-material/Article";
import InfoIcon from "@mui/icons-material/Info";

interface RuleViewerProps {
  ruleId: string;
}

export default function RuleViewer({ ruleId }: RuleViewerProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [ruleData, setRuleData] = useState<any>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [selectedArticleIds, setSelectedArticleIds] = useState<Set<string>>(new Set());

  // 규정 데이터 패치 (선택한 버전 포함)
  useEffect(() => {
    async function loadRule() {
      if (!ruleId) return;
      setLoading(true);
      try {
        let url = `/api/rules/${ruleId}`;
        if (selectedVersion !== null) {
          url += `?version=${selectedVersion}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        setRuleData(data);
        
        // 처음 로드 시에는 현재 로드된 버전의 숫자를 selectedVersion에 동기화
        if (selectedVersion === null && data.currentRevision) {
          setSelectedVersion(data.currentRevision.version);
        }
      } catch (error) {
        console.error("Failed to load rule detail:", error);
      } finally {
        setLoading(false);
      }
    }
    loadRule();
  }, [ruleId, selectedVersion]);

  // ruleId가 바뀔 때마다 버전 초기화 및 탭을 본문(0)으로 전환
  useEffect(() => {
    setSelectedVersion(null);
    setActiveTab(0);
    setSelectedArticleIds(new Set());
  }, [ruleId]);

  if (loading && !ruleData) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 bg-white">
        <CircularProgress size={45} />
        <Typography variant="body1" color="textSecondary" className="font-semibold">
          규정 데이터를 분석하여 렌더링을 구성하는 중입니다...
        </Typography>
      </div>
    );
  }

  if (!ruleData) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white text-slate-400">
        <ArticleIcon sx={{ fontSize: 60 }} className="mb-4 text-slate-300" />
        <p className="text-lg font-medium">규정을 불러올 수 없거나 존재하지 않는 규정입니다.</p>
        <p className="text-sm mt-1">좌측 트리 메뉴에서 보고자 하는 규정을 다시 선택해 주십시오.</p>
      </div>
    );
  }

  const { title, ruleNumber, category, department, attachments, revisions, currentRevision } = ruleData;

  const tocItems = useMemo(() => {
    if (!currentRevision || !currentRevision.articles) return [];
    let toc: any[] = [];
    currentRevision.articles.forEach((a: any) => {
      try {
        let items = typeof a.contentJson === "string" ? JSON.parse(a.contentJson) : a.contentJson;
        if (!Array.isArray(items)) return;
        items.forEach((item: any) => {
          if (item.type === "chapter") {
            const chapterText = item.text || "";
            toc.push({ type: "chapter", id: `toc-${chapterText.replace(new RegExp("\\s", "g"), '-')}`, text: chapterText });
          } else if (item.type === "article") {
            const articleNum = item.num || "";
            toc.push({ type: "article", id: `toc-${articleNum}`, text: articleNum });
          }
        });
      } catch (e) {
        console.error("TOC parsing error", e);
      }
    });
    return toc;
  }, [currentRevision]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // 버전을 직접 클릭하여 해당 버전의 본문을 로딩
  const handleVersionSelect = (verNum: number) => {
    setSelectedVersion(verNum);
    setActiveTab(0); // 본문 탭으로 바로 이동
    setSelectedArticleIds(new Set());
  };

  const handleToggleArticleSelect = (articleNum: string) => {
    setSelectedArticleIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(articleNum)) {
        newSet.delete(articleNum);
      } else {
        newSet.add(articleNum);
      }
      return newSet;
    });
  };

  const handlePrintSelected = () => {
    if (!currentRevision || selectedArticleIds.size === 0) return;
    
    // 선택된 조항의 데이터만 필터링하기 위해 전체 contentJson 파싱
    let printHtml = "";
    
    currentRevision.articles.forEach((a: any) => {
      try {
        let items = typeof a.contentJson === "string" ? JSON.parse(a.contentJson) : a.contentJson;
        if (!Array.isArray(items)) return;
        
        let currentArticleNum: string | null = null;
        let isSelected = false;
        
        items.forEach((item: any) => {
          if (item.type === "article") {
            currentArticleNum = item.num;
            isSelected = currentArticleNum ? selectedArticleIds.has(currentArticleNum) : false;
            if (isSelected) {
              printHtml += `<div class="article-title">${item.num} ${item.text}</div>`;
            }
          } else if (item.type === "paragraph" || item.type === "item" || item.type === "subitem" || (item.type === "text" && !item.text.match(new RegExp("\\d-\\d-\\d-")))) {
            // 현재 순회중인 텍스트가 선택된 조에 속해있다면 인쇄 내용에 포함
            if (isSelected) {
              const prefix = item.num ? `<span style="margin-right: 5px;">${item.num}</span>` : '';
              let padding = "0px";
              if (item.type === "item") padding = "15px";
              if (item.type === "subitem") padding = "30px";
              
              printHtml += `<div class="article-content" style="padding-left: ${padding};">${prefix}${item.text}</div>`;
            }
          } else if (item.type === "chapter" || item.type === "section") {
            // 장, 절이 바뀌면 소속 초기화
            currentArticleNum = null;
            isSelected = false;
          }
        });
      } catch (e) {
        console.error(e);
      }
    });
    
    // 새 창에 인쇄용 화면 구성
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("팝업 차단이 설정되어 있습니다. 팝업 차단을 해제해 주세요.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title} - 선택 조항 인쇄</title>
        <style>
          body { font-family: 'Malgun Gothic', sans-serif; padding: 40px; color: #000; line-height: 1.6; }
          h1 { text-align: center; font-size: 24px; margin-bottom: 40px; }
          .article-title { font-weight: bold; margin-bottom: 10px; margin-top: 30px; font-size: 16px; }
          .article-content { margin-left: 10px; font-size: 14px; margin-bottom: 4px; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>${title} (선택 조항 발췌)</h1>
        ${printHtml}
        <script>
          window.onload = function() { setTimeout(function() { window.print(); }, 500); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden relative">
      {/* 1. 규정 상단 메타 헤더 영역 (로열 블루 배경의 웅장한 타이틀바) */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-950 to-slate-900 p-6 text-white shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="bg-amber-500 text-slate-900 text-xs px-2.5 py-1 rounded font-bold uppercase tracking-wider">
                {category?.name || "분류 없음"}
              </span>
              <span className="text-blue-200 text-sm font-semibold">
                소관부서: {department?.name || "미지정"}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2 flex items-baseline gap-3">
              {title}
              <span className="text-amber-400 text-lg font-semibold">{ruleNumber}</span>
            </h1>
          </div>

          {/* 현재 뷰잉 중인 개정 버전 표시 및 편집 버튼 */}
          {currentRevision && (
            <div className="flex flex-col items-end gap-2">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-lg text-right">
                <p className="text-xs text-blue-200 font-medium">표시중인 버전</p>
                <p className="text-base font-bold text-amber-300">
                  {currentRevision.versionName} 
                  <span className="text-xs text-white font-normal ml-2">
                    (공포일: {new Date(currentRevision.enactmentDate).toLocaleDateString()})
                  </span>
                </p>
              </div>
              <Button
                variant="contained"
                size="small"
                onClick={() => window.location.href = `/admin/rules/${ruleId}/edit`}
                sx={{ bgcolor: 'white', color: '#1e3a8a', '&:hover': { bgcolor: '#f1f5f9' }, fontWeight: 'bold' }}
              >
                규정 직접 편집하기
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 2. 4대 핵심 탭 메뉴바 */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "white", px: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          aria-label="규정 상세 탭 메뉴"
        >
          <Tab icon={<ArticleIcon className="text-lg mr-1" />} iconPosition="start" label="현행규정 본문" />
          <Tab icon={<HistoryIcon className="text-lg mr-1" />} iconPosition="start" label="제·개정 연혁" />
          <Tab icon={<CompareArrowsIcon className="text-lg mr-1" />} iconPosition="start" label="신구조문 대비표" />
          <Tab icon={<FileDownloadIcon className="text-lg mr-1" />} iconPosition="start" label={`관련 서식 (${attachments?.length || 0})`} />
        </Tabs>
      </Box>

      {/* 3. 탭 상세 내용 컨테이너 (스크롤 가능 영역) */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar">
        <div className="max-w-5xl mx-auto">
          {loading && (
            <div className="fixed inset-0 bg-white/60 z-50 flex items-center justify-center">
              <CircularProgress size={40} />
            </div>
          )}

          {/* [Tab 0] 현행규정 본문 탭 */}
          {activeTab === 0 && (
            <div className="flex flex-col md:flex-row gap-6 relative animate-fade-in">
              {/* 좌측 목차(TOC) 네비게이션 바 */}
              {tocItems.length > 0 && (
                <div className="hidden md:block w-56 shrink-0">
                  <div className="sticky top-0 bg-white border border-slate-200 rounded-xl shadow-sm max-h-[75vh] overflow-y-auto scrollbar p-4">
                    <h3 className="font-bold text-slate-800 mb-3 pb-2 border-b border-slate-100 sticky top-0 bg-white z-10">목차</h3>
                    <ul className="space-y-1.5 text-[13.5px]">
                      {tocItems.map((item, idx) => (
                        <li key={idx} className={item.type === "chapter" ? "mt-4 font-bold text-blue-700" : "pl-3 text-slate-600 hover:text-blue-600 cursor-pointer"}>
                          <a href={`#${item.id}`} onClick={(e) => {
                            e.preventDefault();
                            document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}>
                            {item.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* 본문 영역 */}
              <div className="flex-1 min-w-0 bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                {currentRevision ? (
                  <>
                    <div className="border-b border-slate-100 pb-4 mb-6 text-slate-500 text-sm flex items-center gap-2">
                      <InfoIcon className="text-blue-500 text-sm" />
                      본 규정은 <strong>{new Date(currentRevision.effectiveDate).toLocaleDateString()}</strong>일부로 시행되는 현행 규정의 조항 구조입니다.
                    </div>
                    
                    {/* 조항들 차례대로 렌더링 */}
                    {currentRevision.articles && currentRevision.articles.length > 0 ? (
                      <div className="pb-24">
                        {currentRevision.articles.map((article: any) => (
                          <ArticleRenderer
                            key={article.id}
                            id={article.id}
                            chapter={article.chapter}
                            section={article.section}
                            articleNumber={article.articleNumber}
                            title={article.title}
                            contentJson={article.contentJson}
                            contentHtml={article.contentHtml}
                            isSelectable={true}
                            selectedNums={selectedArticleIds}
                            onToggleSelect={handleToggleArticleSelect}
                          />
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      등록된 조항 정보가 존재하지 않습니다.
                    </div>
                  )}


                </>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  개정 이력이 기록되지 않았습니다.
                </div>
              )}
            </div>
            </div>
          )}

          {/* [Tab 1] 제·개정 연혁 탭 */}
          {activeTab === 1 && (
            <div className="animate-fade-in">
              <TableContainer component={Paper} elevation={0} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <Table sx={{ minWidth: 650 }} aria-label="규정 연혁 테이블">
                  <TableHead className="bg-slate-50">
                    <TableRow>
                      <TableCell className="font-bold text-slate-700">차수/개정구분</TableCell>
                      <TableCell className="font-bold text-slate-700" align="center">공포일자</TableCell>
                      <TableCell className="font-bold text-slate-700" align="center">공포번호</TableCell>
                      <TableCell className="font-bold text-slate-700" align="center">시행일자</TableCell>
                      <TableCell className="font-bold text-slate-700">주요 제·개정 이유</TableCell>
                      <TableCell className="font-bold text-slate-700" align="center">본문조회</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {revisions && revisions.length > 0 ? (
                      revisions.map((rev: any) => {
                        const isCurrent = currentRevision?.id === rev.id;
                        return (
                          <TableRow
                            key={rev.id}
                            className={`hover:bg-slate-50 transition-colors ${isCurrent ? "bg-blue-50/40" : ""}`}
                          >
                            <TableCell className="font-semibold text-blue-900">
                              {rev.versionName}
                              {isCurrent && (
                                <span className="ml-2 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                  조회중
                                </span>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {new Date(rev.enactmentDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell align="center">{rev.announcementNumber}</TableCell>
                            <TableCell align="center">
                              {new Date(rev.effectiveDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-slate-600 max-w-xs truncate" title={rev.description || "이유 없음"}>
                              {rev.description || "-"}
                            </TableCell>
                            <TableCell align="center">
                              <Button
                                size="small"
                                variant={isCurrent ? "contained" : "outlined"}
                                color="primary"
                                onClick={() => handleVersionSelect(rev.version)}
                                className="text-xs px-2.5 py-1"
                              >
                                조회
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" className="py-12 text-slate-400">
                          제·개정 연혁 이력이 기록되지 않았습니다.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          )}

          {/* [Tab 2] 신구조문 대비표 탭 */}
          {activeTab === 2 && (
            <div className="animate-fade-in space-y-6">
              {currentRevision?.comparisons && currentRevision.comparisons.length > 0 ? (
                currentRevision.comparisons.map((comp: any) => {
                  return (
                    <div key={comp.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                      {/* 대비 헤더 */}
                      <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex justify-between items-center text-sm font-semibold text-slate-700">
                        <span>
                          {comp.beforeArticle
                            ? `제${comp.beforeArticle.articleNumber}조(${comp.beforeArticle.title}) 대비`
                            : `신설조문 - 제${comp.afterArticle?.articleNumber}조(${comp.afterArticle?.title})`}
                        </span>
                        {comp.note && (
                          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                            비고: {comp.note}
                          </span>
                        )}
                      </div>

                      {/* 2단 분할 대비 내용 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                        {/* 1) 개정 전 조항 */}
                        <div className="p-5">
                          <p className="text-xs text-rose-600 font-bold mb-2 uppercase tracking-wide">
                            개정 전 (구조문)
                          </p>
                          {comp.beforeArticle ? (
                            <div>
                              <p className="font-bold text-slate-800 text-sm mb-2">
                                제{comp.beforeArticle.articleNumber}조 ({comp.beforeArticle.title})
                              </p>
                              <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                                {comp.beforeArticle.contentText}
                              </div>
                            </div>
                          ) : (
                            <p className="text-slate-400 text-sm italic">해당 조항 없음 (신설)</p>
                          )}
                        </div>

                        {/* 2) 개정 후 조항 */}
                        <div className="p-5 bg-emerald-50/10">
                          <p className="text-xs text-emerald-600 font-bold mb-2 uppercase tracking-wide">
                            개정 후 (현행조문)
                          </p>
                          {comp.afterArticle ? (
                            <div>
                              <p className="font-bold text-slate-800 text-sm mb-2">
                                제{comp.afterArticle.articleNumber}조 ({comp.afterArticle.title})
                              </p>
                              <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                {comp.afterArticle.contentText}
                              </div>
                            </div>
                          ) : (
                            <p className="text-rose-600 text-sm italic">해당 조항 폐지</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white text-center py-16 border border-slate-200 rounded-xl text-slate-400 shadow-sm">
                  <CompareArrowsIcon sx={{ fontSize: 50 }} className="mb-2 text-slate-300" />
                  <p className="text-lg font-medium">신구조문 대비표 정보가 존재하지 않습니다.</p>
                  <p className="text-xs mt-1 text-slate-400">
                    본 개정 차수에는 등록된 대비표 매핑 데이터가 없거나, 단순 제정(신설) 건일 수 있습니다.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* [Tab 3] 관련 서식 / 첨부파일 탭 */}
          {activeTab === 3 && (
            <div className="animate-fade-in bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FileDownloadIcon className="text-blue-700" />
                규정 관련 첨부서식 다운로드
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                본 규정과 관련된 기안지, 별지 서식, 작성 가이드 및 관련 파일 목록입니다. 파일명을 클릭하면 즉시 안전하게 다운로드가 실행됩니다.
              </p>

              {attachments && attachments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attachments.map((file: any) => {
                    const isHwp = file.fileType?.toLowerCase() === "hwp";
                    const isPdf = file.fileType?.toLowerCase() === "pdf";

                    let typeBg = "bg-slate-100 text-slate-600";
                    if (isHwp) typeBg = "bg-rose-50 text-rose-700 border border-rose-100";
                    if (isPdf) typeBg = "bg-red-50 text-red-700 border border-red-100";

                    return (
                      <a
                        key={file.id}
                        href={file.fileUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-blue-300 transition-all premium-card-hover group"
                      >
                        <span className={`w-12 h-12 flex items-center justify-center rounded-lg font-bold text-xs uppercase ${typeBg}`}>
                          {file.fileType || "FILE"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                            {file.title}
                          </h4>
                          {file.fileSize && (
                            <p className="text-xs text-slate-400 mt-1">
                              파일크기: {(file.fileSize / 1024).toFixed(1)} KB
                            </p>
                          )}
                        </div>
                        <FileDownloadIcon className="text-slate-400 group-hover:text-blue-700 transition-colors" />
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  등록된 첨부 파일이나 서식이 존재하지 않습니다.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 플로팅 액션 바 (선택된 조항이 있을 때만 표시) */}
      {activeTab === 0 && selectedArticleIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 z-[100] animate-fade-in border border-slate-700">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              {selectedArticleIds.size}
            </span>
            <span className="font-medium text-sm">개 조항 선택됨</span>
          </div>
          <div className="w-px h-6 bg-slate-700"></div>
          <div className="flex items-center gap-3">
            <Button 
              variant="contained" 
              size="small" 
              onClick={handlePrintSelected}
              className="bg-blue-500 hover:bg-blue-600 font-bold px-4"
            >
              선택 인쇄 (PDF 저장)
            </Button>
            <Button 
              variant="text" 
              size="small" 
              onClick={() => setSelectedArticleIds(new Set())}
              className="text-slate-300 hover:text-white"
            >
              선택 해제
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
