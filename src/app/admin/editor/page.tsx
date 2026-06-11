"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CircularProgress } from "@mui/material";
import dynamic from "next/dynamic";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import RuleIcon from "@mui/icons-material/Rule";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import VisibilityIcon from "@mui/icons-material/Visibility";

const JoditEditor = dynamic(() => import("jodit-react"), {
  ssr: false,
  loading: () => <p className="p-4 text-slate-500">에디터 불러오는 중...</p>,
});

/** title이 "의N(실제제목)" 형태인 경우를 감지하여 표시용 레이블을 반환 */
function getArticleLabel(articleNumber: number, title: string): string {
  const subMatch = title.match(/^의(\d+)\((.*)\)$/);
  if (subMatch) {
    return `제${articleNumber}조의${subMatch[1]}(${subMatch[2]})`;
  }
  return `제${articleNumber}조${title ? ` (${title})` : ''}`;
}

/** 조항 번호 뱃지용 짧은 레이블 */
function getArticleNumBadge(articleNumber: number, title: string): string {
  const subMatch = title.match(/^의(\d+)/);
  if (subMatch) {
    return `제 ${articleNumber} 조의 ${subMatch[1]}`;
  }
  return `제 ${articleNumber} 조`;
}

function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ruleIdParam = searchParams.get("ruleId");

  const [rules, setRules] = useState<any[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "compare">("edit");

  // 현재 선택된 규정 상세 정보
  const [ruleDetail, setRuleDetail] = useState<any>(null);
  const [originalArticles, setOriginalArticles] = useState<any[]>([]);
  
  // 개정안 초안 작성 폼 정보
  const [versionName, setVersionName] = useState("");
  const [revisionType, setRevisionType] = useState("AMENDMENT"); // AMENDMENT, TOTAL_AMENDMENT
  const [enactmentDate, setEnactmentDate] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [announceNum, setAnnounceNum] = useState("");
  const [description, setDescription] = useState("");

  // 편집용 조항(Articles) 목록 상태
  const [draftArticles, setDraftArticles] = useState<any[]>([]);
  const [editorMode, setEditorMode] = useState<Record<number, boolean>>({});

  // 신규 조항 추가 위치 지정용 체크 인덱스
  const [checkedArticleIndex, setCheckedArticleIndex] = useState<number | null>(null);

  // 1. 규정 마스터 목록 로드
  useEffect(() => {
    async function loadRules() {
      try {
        const res = await fetch("/api/admin/rules");
        const data = (await res.json()) as any[];
        const sortedData = data.sort((a: any, b: any) => {
          const aParts = (a.ruleNumber || "").split('-').map(Number);
          const bParts = (b.ruleNumber || "").split('-').map(Number);
          for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
            const aVal = aParts[i] || 0;
            const bVal = bParts[i] || 0;
            if (aVal !== bVal) return aVal - bVal;
          }
          return a.title.localeCompare(b.title);
        });
        setRules(sortedData);
        if (ruleIdParam) {
          setSelectedRuleId(ruleIdParam);
        } else if (data.length > 0) {
          setSelectedRuleId(data[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadRules();
  }, [ruleIdParam]);

  // 2. 특정 규정이 선택되었을 때 최신 조문 데이터 조회
  useEffect(() => {
    if (!selectedRuleId) return;
    async function loadRuleDetail() {
      setLoading(true);
      try {
        const res = await fetch(`/api/rules/${selectedRuleId}`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`서버 에러: ${text}`);
        }
        const data = (await res.json()) as any;
        setRuleDetail(data);

        const rev = data.currentRevision;
        if (rev && Array.isArray(rev.articles)) {
          setOriginalArticles(rev.articles);
          
          // 기존 조항들을 복사하여 편집용 초안 상태로 초기화
          const escapeRegex = (s: string) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\s+/g, '\\s*');
          const copied = rev.articles.map((art: any, idx: number, arr: any[]) => {
            let cleanText = art.contentText || "";
            // 다음 조항의 장/절이 현재 조항의 본문 끝에 묻어있는 경우 제거
            const nextArt = arr[idx + 1];
            if (nextArt) {
               if (nextArt.chapter && nextArt.chapter !== art.chapter && nextArt.section && nextArt.section !== art.section) {
                  const chapSecRegex = new RegExp(`\\n*\\s*${escapeRegex(nextArt.chapter)}\\s*\\n*\\s*${escapeRegex(nextArt.section)}\\s*$`);
                  cleanText = cleanText.replace(chapSecRegex, '');
               }
               if (nextArt.chapter && nextArt.chapter !== art.chapter) {
                  const chapRegex = new RegExp(`\\n*\\s*${escapeRegex(nextArt.chapter)}\\s*$`);
                  cleanText = cleanText.replace(chapRegex, '');
               }
               if (nextArt.section && nextArt.section !== art.section) {
                  const secRegex = new RegExp(`\\n*\\s*${escapeRegex(nextArt.section)}\\s*$`);
                  cleanText = cleanText.replace(secRegex, '');
               }
            }
            return {
              ...art,
              contentText: cleanText.trim(),
              isNew: false,
              isDeleted: false,
              isModified: false,
            };
          });
          setDraftArticles(copied);
          
          // 개정 폼 디폴트값 자동 세팅
          const nextVerNum = (data.revisions?.[0]?.version || 1) + 1;
          setVersionName(`제${nextVerNum}차 일부개정`);
          setAnnounceNum(`공포 제${nextVerNum}호`);
          
          const today = new Date().toISOString().split("T")[0];
          setEnactmentDate(today);
          setEffectiveDate(today);
        } else {
          setOriginalArticles([]);
          setDraftArticles([
            {
              chapter: "제1장 총칙",
              articleNumber: 1,
              title: "목적",
              contentText: "제1조 (목적) 이 규정은 학교의 운영에 관한 목적을 규정함을 목적으로 한다.",
              contentJson: { paragraphs: ["이 규정은 학교의 운영에 관한 목적을 규정함을 목적으로 한다."] },
              sortOrder: 1,
              isNew: true,
            },
          ]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadRuleDetail();
  }, [selectedRuleId]);

  // 에디터 입력값 변경 핸들러
  const handleArticleTextChange = (idx: number, newText: string) => {
    setDraftArticles((prev) =>
      prev.map((art, i) => {
        if (i !== idx) return art;
        const orig = originalArticles.find((o) => o.articleNumber === art.articleNumber);
        const isModified = orig ? orig.contentText !== newText : false;
        return {
          ...art,
          contentText: newText,
          isModified,
        };
      })
    );
  };

  // 조항 제목 변경
  const handleArticleTitleChange = (idx: number, newTitle: string) => {
    setDraftArticles((prev) =>
      prev.map((art, i) => (i === idx ? { ...art, title: newTitle, isModified: true } : art))
    );
  };

  // 장(Chapter) 일괄 변경
  const handleChapterChange = (idx: number, newChapter: string) => {
    setDraftArticles((prev) => {
      const oldChapter = prev[idx].chapter;
      const newArticles = [...prev];
      for (let i = idx; i < newArticles.length; i++) {
        if (newArticles[i].chapter === oldChapter) {
          newArticles[i] = { ...newArticles[i], chapter: newChapter, isModified: true };
        } else {
          break;
        }
      }
      return newArticles;
    });
  };

  // 절(Section) 일괄 변경
  const handleSectionChange = (idx: number, newSection: string) => {
    setDraftArticles((prev) => {
      const oldSection = prev[idx].section;
      const oldChapter = prev[idx].chapter;
      const newArticles = [...prev];
      for (let i = idx; i < newArticles.length; i++) {
        if (newArticles[i].section === oldSection && newArticles[i].chapter === oldChapter) {
          newArticles[i] = { ...newArticles[i], section: newSection, isModified: true };
        } else {
          break;
        }
      }
      return newArticles;
    });
  };

  // 신규 조항 추가 (신설)
  const handleAddArticle = () => {
    setDraftArticles((prev) => {
      // 일반 조문(8000 미만) 중 최대 조 번호를 찾음
      const normalArticles = prev.filter((p) => p.articleNumber < 8000);
      const maxNum = normalArticles.length > 0 ? Math.max(...normalArticles.map((p) => p.articleNumber)) : 0;
      const nextNum = maxNum + 1;
      
      const newArticle = {
        chapter: "제1장 총칙",
        articleNumber: nextNum,
        title: "조항 제목",
        contentText: `제${nextNum}조 (제목) `,
        contentJson: { paragraphs: [""] },
        sortOrder: nextNum,
        isNew: true,
        isDeleted: false,
        isModified: false,
      };

      if (checkedArticleIndex !== null && checkedArticleIndex >= 0 && checkedArticleIndex < prev.length) {
        const targetArticle = prev[checkedArticleIndex];
        const targetNum = targetArticle.articleNumber;
        
        // 동일한 조 번호를 가진 기존 조문들 중에서 '의N' 형태의 최대 N값을 찾음
        const relatedArticles = prev.filter(p => p.articleNumber === targetNum);
        let maxSub = 1; // 1부터 시작하므로 다음은 '의2'가 됨
        relatedArticles.forEach(a => {
           const subMatch = a.title.match(/^의(\d+)/);
           if (subMatch) {
              const subNum = parseInt(subMatch[1], 10);
              if (subNum > maxSub) maxSub = subNum;
           }
        });
        const nextSub = maxSub + 1;
        
        newArticle.chapter = targetArticle.chapter || "제1장 총칙";
        newArticle.articleNumber = targetNum;
        newArticle.title = `의${nextSub}(제목)`;
        newArticle.contentText = `제${targetNum}조의${nextSub} (제목) `;
        
        const newArray = [...prev];
        newArray.splice(checkedArticleIndex + 1, 0, newArticle);
        setCheckedArticleIndex(null); // 추가 후 체크 해제
        return newArray;
      }

      newArticle.chapter = prev[prev.length - 1]?.chapter || "제1장 총칙";
      return [...prev, newArticle];
    });
  };

  // 조항 삭제 (삭제 표시)
  const handleToggleDeleteArticle = (idx: number) => {
    setDraftArticles((prev) =>
      prev.map((art, i) => {
        if (i !== idx) return art;
        return {
          ...art,
          isDeleted: !art.isDeleted,
        };
      })
    );
  };

  // 단순 수정 (실시간 저장, 개정 절차 생략)
  const handleSimpleSave = async (idx: number) => {
    const art = draftArticles[idx];
    if (art.isNew) {
      alert("신설된 조항은 단순수정이 불가합니다. 최종 배포 시 함께 저장됩니다.");
      return;
    }
    if (!art.id) {
      alert("조항 ID를 찾을 수 없습니다.");
      return;
    }
    
    if (!confirm("규정을 수정하려면, 규정개정 절차를 거쳐야하며 본 기능은 단순수정기능으로만 사용하시기 바랍니다.\n\n정말로 이 조항의 내용을 실서버에 즉시 단순 수정하시겠습니까?")) {
      return;
    }
    
    setSaving(true);
    try {
      let updatedContentText = art.contentText.trim();
      let finalContentJson = art.contentJson || { paragraphs: [updatedContentText.split(") ").slice(1).join(") ") || updatedContentText] };

      const res = await fetch(`/api/admin/articles/${art.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           contentJson: finalContentJson,
           contentText: updatedContentText,
           title: art.title,
           chapter: art.chapter,
           section: art.section
        })
      });
      
      if (res.ok) {
        alert("성공적으로 단순 수정되었습니다.");
        setDraftArticles((prev) =>
          prev.map((a, i) => (i === idx ? { ...a, isModified: false } : a))
        );
      } else {
        const data = await res.json() as any;
        alert(data.error || "단순 수정 실패");
      }
    } catch (e: any) {
      console.error(e);
      alert(`단순 수정 중 오류 발생: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // 일괄 단순 수정 (간격 및 중복 제목 제거)
  const handleSimpleSaveAll = async () => {
    if (!confirm("모든 조항의 간격 및 중복 제목 오류를 일괄 정상화하시겠습니까? (이 작업은 되돌릴 수 없으며, 실서버에 즉시 반영됩니다.)")) {
      return;
    }

    setSaving(true);
    let successCount = 0;
    let failCount = 0;

    for (let idx = 0; idx < draftArticles.length; idx++) {
      const art = draftArticles[idx];
      if (art.isNew || art.isDeleted || !art.id) continue;

      try {
        let updatedContentText = art.contentText.trim();
        let finalContentJson = art.contentJson || { paragraphs: [updatedContentText.split(") ").slice(1).join(") ") || updatedContentText] };

        const res = await fetch(`/api/admin/articles/${art.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
             contentJson: finalContentJson,
             contentText: updatedContentText,
             title: art.title,
             chapter: art.chapter,
             section: art.section
          })
        });

        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (e) {
        failCount++;
      }
    }

    setSaving(false);
    alert(`조문 형식 일괄 정상화 완료!\n- 성공: ${successCount}개 조항\n- 실패: ${failCount}개 조항\n새로고침을 진행합니다.`);
    window.location.reload();
  };

  // 최종 개정안 저장 및 클라우드 배포 진행
  const handlePublishRevision = async () => {
    if (!versionName || !enactmentDate || !effectiveDate) {
      alert("공포일자, 시행일자, 개정 버전 이름을 모두 입력해 주십시오.");
      return;
    }

    const hasModifications = draftArticles.some(art => art.isModified || art.isNew || art.isDeleted);
    if (!hasModifications) {
      alert("수정된 조항이 없습니다. 변경 사항을 작성한 후 배포해 주십시오.");
      return;
    }

    if (!confirm(`${versionName} 최종 결제를 완료하고 클라우드 데이터베이스에 실시간 배포하시겠습니까?`)) {
      return;
    }

    setSaving(true);
    try {
      const formattedDate = enactmentDate.replace(/-/g, '.');

      // 삭제된 항목은 필터링하여 저장할 조항 리스트 구성
      const articlesToSave = draftArticles
        .filter((art) => !art.isDeleted)
        .map((art, idx) => {
          let updatedContentText = art.contentText.trim();
          let finalContentJson = art.contentJson;
          let finalContentHtml = art.contentHtml;

          if (art.isNew) {
            const tag = ` <신설 ${formattedDate}>`;
            if (!updatedContentText.includes(tag)) {
              updatedContentText += tag;
            }
            finalContentJson = { paragraphs: [updatedContentText.split(") ").slice(1).join(") ") || updatedContentText] };
            finalContentHtml = null;
          } else if (art.isModified) {
            const tag = ` <개정 ${formattedDate}>`;
            if (!updatedContentText.includes(tag)) {
              updatedContentText += tag;
            }
            finalContentJson = { paragraphs: [updatedContentText.split(") ").slice(1).join(") ") || updatedContentText] };
            finalContentHtml = null;
          }

          return {
            chapter: art.chapter,
            section: art.section,
            articleNumber: art.articleNumber,
            title: art.title,
            contentText: updatedContentText,
            contentJson: finalContentJson,
            contentHtml: finalContentHtml,
            sortOrder: idx + 1,
          };
        });

      const res = await fetch("/api/admin/revisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruleId: selectedRuleId,
          versionName,
          revisionType,
          enactmentDate,
          effectiveDate,
          announcementNumber: announceNum,
          description,
          articles: articlesToSave,
        }),
      });

      let data;
      const textResponse = await res.text();
      try {
        data = JSON.parse(textResponse) as any;
      } catch (e) {
        throw new Error(`Server returned non-JSON response: ${textResponse}`);
      }

      if (res.ok) {
        alert(`🎉 ${versionName} 배포가 성공적으로 완료되었습니다!`);
        router.push("/admin/rules");
      } else {
        alert(data.error || "배포 실패");
      }
    } catch (e: any) {
      console.error(e);
      alert(`네트워크/서버 오류: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading && rules.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-slate-50">
        <CircularProgress size={30} sx={{ color: "#0c3161" }} />
        <span className="text-slate-550 text-sm font-semibold">입안편집기(DLMS) 엔진 초기화 중...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden text-slate-800">
      
      {/* ==================== 1. 상단 규정 선택 & 메타 폼 ==================== */}
      <div className="relative bg-[#008080]/10 border-b border-slate-200 p-6 space-y-4 shrink-0 z-10 shadow-sm overflow-hidden">
        {/* 학교 전경 이미지 배경 */}
        <div 
          className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none" 
          style={{ backgroundImage: "url('/yewon2.jpeg')" }}
        />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 select-none">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/rules"
              className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-650 hover:text-slate-900 transition-all cursor-pointer shadow-sm"
            >
              <ArrowBackIcon sx={{ fontSize: 20 }} />
            </Link>
            <h1 className="text-lg font-black text-slate-850 flex items-center gap-2">
              <RuleIcon className="text-[#0c3161]" />
              실시간 온라인 입안편집기 (Web-DLMS)
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSimpleSaveAll}
              disabled={saving || draftArticles.length === 0}
              className="bg-white border border-[#0c3161] text-[#0c3161] hover:bg-slate-50 text-sm font-black px-4 py-2.5 rounded-xl shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="이 규정의 모든 조항의 간격 및 중복 제목 오류를 자동으로 일괄 수정하여 실서버에 적용합니다."
            >
              <SaveIcon sx={{ fontSize: 18 }} />
              전체 조문 일괄 정상화(저장)
            </button>
            <button
              type="button"
              onClick={handlePublishRevision}
              disabled={saving}
              className="bg-[#0c3161] hover:bg-[#092244] text-white text-sm font-black px-5 py-2.5 rounded-xl shadow-lg shadow-[#0c3161]/10 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <SaveIcon sx={{ fontSize: 18 }} />
              {saving ? "실서버 배포 중..." : "최종 배포 저장"}
            </button>
          </div>
        </div>

        {/* 개정 메타데이터 정보 입력 폼 */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-6 gap-4 bg-slate-50 p-5 border border-slate-200 rounded-2xl text-sm shadow-sm">
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-slate-550 font-bold tracking-wider pl-1">대상 규정 선택</label>
            <select
              value={selectedRuleId}
              onChange={(e) => setSelectedRuleId(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-extrabold focus:outline-none cursor-pointer text-base"
            >
              {rules.map((r) => (
                <option key={r.id} value={r.id} className="text-slate-800">
                  {r.title} ({r.ruleNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-slate-550 font-bold tracking-wider pl-1">개정 버전 기호</label>
            <input
              type="text"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="예: 제16차 일부개정"
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-extrabold focus:outline-none focus:ring-1 focus:ring-[#0c3161] text-base"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-slate-550 font-bold tracking-wider pl-1">공포 기호/번호</label>
            <input
              type="text"
              value={announceNum}
              onChange={(e) => setAnnounceNum(e.target.value)}
              placeholder="예: 공포 제16호"
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-extrabold focus:outline-none focus:ring-1 focus:ring-[#0c3161] text-base"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-slate-550 font-bold tracking-wider pl-1">공포 일자</label>
            <input
              type="date"
              value={enactmentDate}
              onChange={(e) => setEnactmentDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-extrabold focus:outline-none focus:ring-1 focus:ring-[#0c3161] text-base"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-slate-550 font-bold tracking-wider pl-1">시행 일자</label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-extrabold focus:outline-none focus:ring-1 focus:ring-[#0c3161] text-base"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-slate-550 font-bold tracking-wider pl-1">개정 사유/설명</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="개정 사유 입력..."
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-extrabold focus:outline-none focus:ring-1 focus:ring-[#0c3161] text-base"
            />
          </div>

        </div>

        {/* 탭 바 컨트롤 */}
        <div className="relative z-10 flex gap-2 text-[15px] font-black select-none mt-4">
          <button
            onClick={() => setActiveTab("edit")}
            className={`w-[240px] py-3 rounded-t-xl transition-all cursor-pointer text-center ${
              activeTab === "edit" ? "bg-[#006666] text-white shadow-md" : "bg-[#008080]/30 text-[#003333] hover:bg-[#008080]/40 hover:text-slate-900"
            }`}
          >
            조문 작성 편집기
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`w-[240px] py-3 rounded-t-xl transition-all cursor-pointer text-center ${
              activeTab === "preview" ? "bg-[#006666] text-white shadow-md" : "bg-[#008080]/30 text-[#003333] hover:bg-[#008080]/40 hover:text-slate-900"
            }`}
          >
            개정원문 실시간 프리뷰
          </button>
          <button
            onClick={() => setActiveTab("compare")}
            className={`w-[280px] py-3 rounded-t-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "compare" ? "bg-[#006666] text-white shadow-md" : "bg-[#008080]/30 text-[#003333] hover:bg-[#008080]/40 hover:text-slate-900"
            }`}
          >
            <CompareArrowsIcon sx={{ fontSize: 18 }} />
            신구조문대비표 자동 생성 뷰
          </button>
        </div>
      </div>

      {/* ==================== 2. 메인 작업 패널 영역 ==================== */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* 2-1) [조문 작성 편집기] 탭 */}
        {activeTab === "edit" && (
          <div className="h-full w-full flex overflow-hidden">
            
            {/* 좌측: 현행 규정 뷰어 (참조용, Read Only) */}
            <div className="w-[420px] bg-white border-r border-slate-200 p-6 flex flex-col overflow-hidden shrink-0 shadow-sm">
              <h3 className="text-base font-black text-slate-600 border-b border-slate-200 pb-3 mb-4 flex items-center gap-1.5 select-none font-sans">
                <VisibilityIcon sx={{ fontSize: 18 }} />
                [참조] 현행 규정 조문 뷰어
              </h3>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar text-base">
                {originalArticles.length === 0 ? (
                  <div className="text-center py-20 text-slate-450 font-bold select-none text-base">
                    조회된 현행 규정이 없습니다.
                  </div>
                ) : (
                  originalArticles.map((art) => (
                    <div key={art.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 shadow-sm">
                      <div className="text-sm text-slate-500 font-black">{art.chapter || "총칙"}</div>
                      <div className="text-[#0c3161] font-black text-base">{art.title}</div>
                      <p className="text-slate-700 leading-relaxed font-bold mt-2 whitespace-pre-wrap text-[15px]">
                        {art.contentText}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 우측: 개정안 작업창 (실시간 인터랙티브 에디터) */}
            <div className="flex-1 p-8 flex flex-col overflow-hidden bg-slate-50">
              <div className="flex items-center justify-between bg-[#9bbabf] p-4 rounded-xl mb-6 shrink-0 select-none shadow-sm">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span className="text-[#092244]">■</span> 개정안 작성
                </h3>

                <div className="flex items-center gap-3">
                  <select
                    className="bg-white/95 text-sm font-bold text-slate-800 border-none rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#0c3161]/50 cursor-pointer w-48 shadow-sm"
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const el = document.getElementById(`editor-art-${e.target.value}`);
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                        // 약간 하이라이트 효과를 줄 수도 있음
                        el.classList.add("ring-4", "ring-[#0c3161]/30");
                        setTimeout(() => el.classList.remove("ring-4", "ring-[#0c3161]/30"), 1500);
                      }
                      e.target.value = "";
                    }}
                  >
                    <option value="">조문 검색 (이동)...</option>
                    {draftArticles.map((a, i) => {
                      if (a.isDeleted) return null;
                      return <option key={i} value={i}>{a.articleNumber || "신설조항"} {a.title}</option>;
                    })}
                  </select>

                  <button
                    type="button"
                    onClick={handleAddArticle}
                    className="bg-white hover:bg-slate-50 text-slate-800 text-sm font-black px-4 py-2 rounded-lg active:scale-95 transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                  >
                    <AddIcon sx={{ fontSize: 18 }} />
                    조항 신설 (+추가)
                  </button>
                </div>
              </div>

              {/* 편집 에디터 조항 목록 */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar">
                {draftArticles.map((art, idx) => {
                  let borderClass = "border-slate-200 bg-white shadow-sm";
                  let tagText = "";
                  let tagBg = "";
                  
                  if (art.isDeleted) {
                    borderClass = "border-rose-200 bg-rose-50/50 opacity-60";
                    tagText = "삭제 예정";
                    tagBg = "bg-rose-50 text-rose-700 border border-rose-100 font-black";
                  } else if (art.isNew) {
                    borderClass = "border-emerald-250 bg-emerald-50/30";
                    tagText = "신설";
                    tagBg = "bg-emerald-50 text-emerald-700 border border-emerald-100 font-black";
                  } else if (art.isModified) {
                    borderClass = "border-amber-250 bg-amber-50/30";
                    tagText = "수정";
                    tagBg = "bg-amber-50 text-amber-700 border border-amber-100 font-black";
                  }

                  return (
                    <div
                      id={`editor-art-${idx}`}
                      key={idx}
                      className={`p-6 rounded-2xl border ${borderClass} transition-all space-y-4`}
                    >
                      <div className="flex items-center justify-between gap-4 select-none">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox"
                            checked={checkedArticleIndex === idx}
                            onChange={() => setCheckedArticleIndex(checkedArticleIndex === idx ? null : idx)}
                            className="w-5 h-5 cursor-pointer accent-[#0c3161]"
                            title="이 조항 아래에 신설하려면 체크하세요"
                          />
                          <span className="text-sm font-black bg-slate-100 text-slate-650 px-3 py-1 rounded border border-slate-200">
                            {getArticleNumBadge(art.articleNumber, art.title)}
                          </span>
                          {tagText && (
                            <span className={`text-xs font-black px-2 py-1 rounded ${tagBg}`}>
                              {tagText}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* 단순 저장 버튼 (기존 조항에만 표시) */}
                          {!art.isDeleted && !art.isNew && (
                            <button
                              type="button"
                              onClick={() => handleSimpleSave(idx)}
                              className="w-[90px] h-[40px] flex items-center justify-center bg-white border border-[#0c3161] text-[#0c3161] rounded-lg text-sm font-bold hover:bg-slate-50 transition-all cursor-pointer active:scale-95 shadow-sm"
                              title="개정 절차 없이 현재 조항의 내용만 실시간으로 수정합니다."
                            >
                              저장
                            </button>
                          )}
                          {/* 개정(저장) 버튼 */}
                          {!art.isDeleted && (
                            <button
                              type="button"
                              onClick={() => {
                                alert("해당 조문의 개정 내용이 임시 반영되었습니다. 최종 배포 시 함께 저장됩니다.");
                                // 강제 수정 마킹
                                setDraftArticles((prev) =>
                                  prev.map((a, i) => (i === idx ? { ...a, isModified: true } : a))
                                );
                              }}
                              className="w-[90px] h-[40px] flex items-center justify-center bg-[#0c3161] border border-[#092244] text-white rounded-lg text-sm font-bold hover:bg-[#092244] transition-all cursor-pointer active:scale-95 shadow-sm"
                            >
                              개정(저장)
                            </button>
                          )}
                          {/* 삭제 토글 버튼 */}
                          <button
                            type="button"
                            onClick={() => handleToggleDeleteArticle(idx)}
                            className={`w-[90px] h-[40px] flex items-center justify-center rounded-lg border transition-all cursor-pointer active:scale-95 ${
                              art.isDeleted
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : "bg-rose-50 border-rose-200 text-rose-650 hover:bg-rose-100"
                            }`}
                            title={art.isDeleted ? "삭제 취소" : "삭제"}
                          >
                            <DeleteIcon sx={{ fontSize: 20 }} />
                          </button>
                        </div>
                      </div>

                      {/* 입력 영역 */}
                      {!art.isDeleted && (
                        <div className="flex flex-col gap-5 mt-2">
                          {/* 장/절 편집 입력 */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm">
                            <div className="space-y-2">
                              <label className="text-xs text-[#0c3161] font-black uppercase tracking-wider pl-1">소속 장 (Chapter)</label>
                              <input
                                type="text"
                                value={art.chapter || ""}
                                onChange={(e) => handleChapterChange(idx, e.target.value)}
                                placeholder="예: 제1장 총칙"
                                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-800 placeholder-slate-400 font-extrabold focus:outline-none focus:ring-2 focus:ring-[#0c3161] focus:border-[#0c3161] text-[15px] transition-all"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs text-[#0c3161] font-black uppercase tracking-wider pl-1">소속 절 (Section)</label>
                              <input
                                type="text"
                                value={art.section || ""}
                                onChange={(e) => handleSectionChange(idx, e.target.value)}
                                placeholder="예: 제1절 목적"
                                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-800 placeholder-slate-400 font-extrabold focus:outline-none focus:ring-2 focus:ring-[#0c3161] focus:border-[#0c3161] text-[15px] transition-all"
                              />
                            </div>
                          </div>

                          {/* 제목 및 본문 편집 입력 */}
                          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-5 text-base">
                            <div className="space-y-2">
                              <label className="text-sm text-slate-500 font-bold uppercase tracking-wider pl-1">조 조항 제목</label>
                              <input
                                type="text"
                                value={art.title}
                                onChange={(e) => handleArticleTitleChange(idx, e.target.value)}
                                placeholder="예: 목적"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 font-bold focus:outline-none focus:ring-2 focus:ring-[#0c3161] focus:border-[#0c3161] text-base"
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-sm text-slate-500 font-bold uppercase tracking-wider pl-1">조문 본문 전문</label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditorMode(prev => ({...prev, [idx]: !(prev[idx] ?? /<table|<p /i.test(art.contentText))}));
                                  }}
                                  className="text-xs font-bold px-2 py-0.5 rounded border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                  {(editorMode[idx] ?? /<table|<p /i.test(art.contentText)) ? "HTML 에디터 끄기" : "HTML 에디터 켜기"}
                                </button>
                              </div>
                              {(editorMode[idx] ?? /<table|<p /i.test(art.contentText)) ? (
                                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                                  <JoditEditor
                                    value={art.contentText}
                                    config={{
                                      readonly: false,
                                      placeholder: '여기에 조문 내용을 입력하세요...',
                                      height: 300,
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
                                    }}
                                    onBlur={newContent => handleArticleTextChange(idx, newContent)}
                                    onChange={() => {}}
                                  />
                                </div>
                              ) : (
                                <textarea
                                  rows={5}
                                  value={art.contentText}
                                  onChange={(e) => handleArticleTextChange(idx, e.target.value)}
                                  placeholder="예: 제1조 (목적) 이 규정은 학교의..."
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-slate-800 placeholder-slate-400 font-bold focus:outline-none focus:ring-2 focus:ring-[#0c3161] focus:border-[#0c3161] leading-relaxed resize-none text-base"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        )}

        {/* 2-2) [개정원문 실시간 프리뷰] 탭 */}
        {activeTab === "preview" && (
          <div className="h-full overflow-y-auto p-10 scrollbar bg-slate-50">
            <div className="max-w-4xl mx-auto bg-white text-slate-800 p-10 md:p-16 rounded-2xl shadow-sm border border-slate-200 select-none">
              
              {/* 개정원문 기안지 스타일 UI */}
              <div className="text-center space-y-2 mb-10">
                <div className="text-sm text-slate-400 font-bold">【 {versionName} 공포안 】</div>
                <h2 className="text-3xl font-black text-slate-900">
                  {ruleDetail?.title || "선택된 규정"} 일부개정규정안
                </h2>
              </div>

              <div className="text-base leading-relaxed space-y-8 text-slate-700 font-medium">
                <p>
                  {ruleDetail?.title || "선택한 규정"} 일부를 다음과 같이 개정한다.
                </p>

                {/* 개정된 내용 조항들 프리뷰 루프 */}
                <div className="space-y-8 pl-5 border-l-4 border-slate-200">
                  {draftArticles.map((art, idx) => {
                    if (art.isDeleted) {
                      return (
                        <div key={idx} className="text-slate-400 italic text-sm">
                          {getArticleLabel(art.articleNumber, art.title)}은 **삭제**합니다.
                        </div>
                      );
                    }
                    return (
                      <div key={idx} className="space-y-2">
                        <div className="font-extrabold text-slate-900 text-base">
                          {getArticleLabel(art.articleNumber, art.title)}
                          {art.isNew && <span className="ml-2 text-emerald-600 text-sm font-bold">[신설]</span>}
                          {art.isModified && <span className="ml-2 text-amber-600 text-sm font-bold">[개정]</span>}
                        </div>
                        <p className="bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap font-mono text-sm text-slate-800 leading-relaxed">
                          {art.contentText}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-8 border-t border-slate-200 mt-10">
                  <h4 className="font-bold text-slate-900 text-lg">부 칙</h4>
                  <p className="text-sm text-slate-600 mt-3 font-medium">
                    이 규정은 공포한 날({enactmentDate})부터 시행한다.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 2-3) [신구조문대비표 자동 생성 뷰] 탭 */}
        {activeTab === "compare" && (
          <div className="h-full overflow-y-auto p-10 scrollbar bg-slate-50">
            <div className="max-w-6xl mx-auto space-y-6 pb-12">
              
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 select-none">
                <h3 className="text-base font-black text-slate-850 flex items-center gap-2">
                  <CompareArrowsIcon className="text-[#0c3161]" />
                  실시간 신구조문대비표 (현행 vs 개정안 대비)
                </h3>
                <span className="text-xs text-slate-500 font-bold">
                  * 조항 번호(articleNumber) 기준으로 자동 대조되어 생성되었습니다.
                </span>
              </div>

              {/* 대비표 테이블 */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 select-none font-black text-[13px]">
                      <th className="py-5 px-6 border-r border-slate-200 w-[45%]">현 행 (개정 전)</th>
                      <th className="py-5 px-6 border-r border-slate-200 w-[45%]">개 정 안 (개정 후)</th>
                      <th className="py-5 px-4 w-[10%] text-center">비고 (개정종류)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // 전체 조항 번호 추출
                      const allNums = Array.from(
                        new Set([
                          ...originalArticles.map((a) => a.articleNumber),
                          ...draftArticles.map((a) => a.articleNumber),
                        ])
                      ).sort((a, b) => a - b);

                      if (allNums.length === 0) {
                        return (
                          <tr>
                            <td colSpan={3} className="py-20 text-center text-slate-450 font-bold text-sm">
                              대비할 조항 데이터가 없습니다.
                            </td>
                          </tr>
                        );
                      }

                      return allNums.map((num) => {
                        const oldArt = originalArticles.find((o) => o.articleNumber === num);
                        const draftArt = draftArticles.find((d) => d.articleNumber === num);

                        // 둘 다 있고 변경 없는 경우 -> 표시 제외 또는 생략 표시
                        const hasNoChange = oldArt && draftArt && oldArt.contentText === draftArt.contentText && !draftArt.isDeleted;
                        
                        if (hasNoChange) {
                          return (
                            <tr key={num} className="border-b border-slate-100 text-slate-400 select-none">
                              <td className="py-4 px-6 border-r border-slate-150 italic text-sm">{getArticleLabel(num, oldArt.title)} - (생 략)</td>
                              <td className="py-4 px-6 border-r border-slate-150 italic text-sm">{getArticleLabel(num, oldArt.title)} - (현행과 같음)</td>
                              <td className="py-4 px-4 text-center text-slate-400 font-semibold text-sm">-</td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={num} className="border-b border-slate-200 hover:bg-slate-50/50 transition-colors">
                            
                            {/* 개정 전 */}
                            <td className="py-5 px-6 border-r border-slate-200 text-slate-700 leading-relaxed align-top">
                              {oldArt ? (
                                <div className="space-y-1.5">
                                  <div className="font-black text-slate-500 font-sans text-sm">{getArticleLabel(oldArt.articleNumber, oldArt.title)}</div>
                                  <p className="whitespace-pre-wrap mt-2 font-bold text-[14px]">{oldArt.contentText}</p>
                                </div>
                              ) : (
                                <span className="text-emerald-700 font-black italic bg-emerald-50 px-3 py-1 rounded border border-emerald-100 text-xs">
                                  &lt; 본조 신설 &gt;
                                </span>
                              )}
                            </td>

                            {/* 개정 후 */}
                            <td className="py-5 px-6 border-r border-slate-200 text-slate-700 leading-relaxed align-top">
                              {draftArt && !draftArt.isDeleted ? (
                                <div className="space-y-1.5">
                                  <div className="font-black text-[#0c3161] font-sans text-sm">{getArticleLabel(draftArt.articleNumber, draftArt.title)}</div>
                                  <p className="whitespace-pre-wrap mt-2 bg-amber-50 p-3 rounded-lg border border-amber-100 text-slate-800 font-bold text-[14px]">
                                    {draftArt.contentText}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-rose-705 font-black italic bg-rose-50 px-3 py-1 rounded border border-rose-100 text-xs">
                                  &lt; 조항 삭제 &gt;
                                </span>
                              )}
                            </td>

                            {/* 비고 */}
                            <td className="py-5 px-4 text-center align-middle select-none">
                              {(!oldArt && draftArt) && (
                                <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-md font-black text-[11px]">
                                  신설
                                </span>
                              )}
                              {(oldArt && draftArt && draftArt.isDeleted) && (
                                <span className="text-rose-700 bg-rose-50 border border-rose-100 px-3 py-1 rounded-md font-black text-[11px]">
                                  삭제
                                </span>
                              )}
                              {(oldArt && draftArt && !draftArt.isDeleted && oldArt.contentText !== draftArt.contentText) && (
                                <span className="text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1 rounded-md font-black text-[11px]">
                                  개정
                                </span>
                              )}
                            </td>

                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}

export default function AdminEditor() {
  return (
    <Suspense fallback={
      <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-slate-50">
        <CircularProgress size={30} sx={{ color: "#0c3161" }} />
        <span className="text-slate-500 text-sm font-semibold">입안편집기(DLMS) 엔진 초기화 중...</span>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
