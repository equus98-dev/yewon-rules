"use client";

import React, { useMemo } from "react";
import { diffWords } from "diff";

interface CompareViewProps {
  currentRevision: any;
  allRevisions: any[];
}

export default function CompareView({ currentRevision, allRevisions }: CompareViewProps) {
  const comparisons = currentRevision?.comparisons || [];

  const prevRevision = useMemo(() => {
    if (!allRevisions || !currentRevision) return null;
    const sortedRevisions = [...allRevisions].sort((a, b) => b.version - a.version);
    const currentIndex = sortedRevisions.findIndex(r => r.version === currentRevision.version);
    if (currentIndex >= 0 && currentIndex < sortedRevisions.length - 1) {
      return sortedRevisions[currentIndex + 1];
    }
    return null;
  }, [allRevisions, currentRevision]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "날짜없음";
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? "날짜없음" : d.toISOString().split("T")[0];
  };

  const prevDate = prevRevision ? formatDate(prevRevision.enactmentDate) : "이전 내역 없음";
  const currDate = currentRevision ? formatDate(currentRevision.enactmentDate) : "";

  // 텍스트 diff를 수행하여 렌더링 가능한 React Node로 변환하는 함수
  const renderDiff = (oldText: string, newText: string, type: 'old' | 'new') => {
    if (!oldText && !newText) return null;
    
    // 단순화: 텍스트가 비어있으면 삭제 또는 신설
    if (!oldText) {
      return type === 'new' ? <span className="bg-yellow-200">{newText}</span> : null;
    }
    if (!newText) {
      return type === 'old' ? <span className="line-through text-slate-400">{oldText}</span> : null;
    }

    const diffs = diffWords(oldText, newText);

    return diffs.map((part, index) => {
      if (part.added) {
        return type === 'new' ? <span key={index} className="bg-yellow-200">{part.value}</span> : null;
      }
      if (part.removed) {
        return type === 'old' ? <span key={index} className="line-through text-slate-400 bg-slate-100">{part.value}</span> : null;
      }
      return <span key={index}>{part.value}</span>;
    });
  };

  const formatArticleTitle = (article: any) => {
    if (!article) return "";
    let title = `제${article.articleNumber}조`;
    if (article.title) {
      title += ` (${article.title})`;
    }
    return title;
  };

  const processedComparisons = useMemo(() => {
    if (!comparisons) return [];
    return comparisons.map((comp: any) => {
      const before = comp.beforeArticle;
      const after = comp.afterArticle;
      
      let beforeText = before?.contentText || "";
      let afterText = after?.contentText || "";

      if (!beforeText && before?.contentJson) {
         try {
           const parsed = typeof before.contentJson === 'string' ? JSON.parse(before.contentJson) : before.contentJson;
           if (parsed?.paragraphs) beforeText = parsed.paragraphs.join("\n");
           else if (Array.isArray(parsed)) beforeText = parsed.map((item: any) => (item.num ? item.num + " " : "") + (item.text || "")).join("\n");
         } catch (e) {}
      }
      if (!afterText && after?.contentJson) {
         try {
           const parsed = typeof after.contentJson === 'string' ? JSON.parse(after.contentJson) : after.contentJson;
           if (parsed?.paragraphs) afterText = parsed.paragraphs.join("\n");
           else if (Array.isArray(parsed)) afterText = parsed.map((item: any) => (item.num ? item.num + " " : "") + (item.text || "")).join("\n");
         } catch (e) {}
      }

      beforeText = beforeText.replace(/^(제\d+조(?:의\d+)?)\s+\1/, '$1');
      afterText = afterText.replace(/^(제\d+조(?:의\d+)?)\s+\1/, '$1');

      if (before?.articleNumber >= 8000 || beforeText.includes("부 칙") || beforeText.includes("부칙")) {
        beforeText = beforeText.replace(/\s*(?:\[|〔|<)(?:별지|별표)[\s\S]*$/i, '');
      }
      if (after?.articleNumber >= 8000 || afterText.includes("부 칙") || afterText.includes("부칙")) {
        afterText = afterText.replace(/\s*(?:\[|〔|<)(?:별지|별표)[\s\S]*$/i, '');
      }

      // 연혁 태그 (<개정 ...>, <신설 ...> 등)를 완전히 제거하여 HTML 표가 깨지거나 diff 결과가 지저분해지는 것 방지
      const stripHistoryTags = (text: string) => {
         return text
           .replace(/(?:&lt;|<)\s*(?:개정|신설|삭제|전문개정|본조신설)[\s\S]*?(?:&gt;|>)/gi, '')
           .trim();
      };
      beforeText = stripHistoryTags(beforeText);
      afterText = stripHistoryTags(afterText);

      let beforeHtml = before?.contentHtml || before?.contentText || '';
      let afterHtml = after?.contentHtml || after?.contentText || '';
      
      beforeHtml = stripHistoryTags(beforeHtml);
      afterHtml = stripHistoryTags(afterHtml);

      const cleanHtmlForTable = (html: string) => {
        let cleaned = html;
        // HWP generated HTML contains many empty paragraphs and <br> tags that stretch table cells.
        // Remove <p> tags that contain only whitespace, &nbsp;, <br>, or empty spans
        cleaned = cleaned.replace(/<p[^>]*>\s*(?:<span[^>]*>\s*&nbsp;\s*<\/span>|<br\s*\/?>|&nbsp;|\s)*<\/p>/gi, '');
        // Remove <br> tags immediately before </td>
        cleaned = cleaned.replace(/<br\s*\/?>\s*(?=<\/td>)/gi, '');
        // Also remove any remaining empty paragraphs that might just be <p></p>
        cleaned = cleaned.replace(/<p[^>]*>\s*<\/p>/gi, '');
        return cleaned;
      };

      beforeHtml = cleanHtmlForTable(beforeHtml);
      afterHtml = cleanHtmlForTable(afterHtml);

      const beforeHasTable = beforeHtml.includes('<table');
      const afterHasTable = afterHtml.includes('<table');
      const hasTable = beforeHasTable || afterHasTable;

      const unescapeAndStrip = (text: string) => {
        return text.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
      };
      const strippedBefore = unescapeAndStrip(beforeText);
      const strippedAfter = unescapeAndStrip(afterText);

      let isIdentical = false;
      if (before && after) {
         if (hasTable) {
            isIdentical = beforeHtml.trim() === afterHtml.trim();
         } else {
            isIdentical = strippedBefore === strippedAfter;
         }
      }

      return {
        ...comp,
        parsedBeforeText: strippedBefore,
        parsedAfterText: strippedAfter,
        parsedBeforeHtml: beforeHtml,
        parsedAfterHtml: afterHtml,
        hasTable,
        isIdentical
      };
    }).filter((comp: any) => !comp.isIdentical);
  }, [comparisons]);

  if (!processedComparisons || processedComparisons.length === 0) {
    return (
      <div className="p-10 text-center text-slate-500 flex flex-col items-center justify-center h-full">
        <h3 className="text-xl font-bold mb-2">신구대비표 데이터가 없습니다</h3>
        <p>이 개정안에는 비교할 수 있는 조항 변경 내역이 없거나 아직 신구대비표가 생성되지 않았습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 p-6 w-full h-full">
      <div className="w-full max-w-none mx-auto bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="grid grid-cols-2 bg-[#eef3f8] border-b border-slate-300 sticky top-0 z-10">
          <div className="p-4 text-center font-bold text-slate-800 border-r border-slate-300">
            이전연혁 [{prevDate}]
          </div>
          <div className="p-4 text-center font-bold text-slate-800">
            현재연혁 [{currDate}]
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {processedComparisons.map((comp: any) => {
            const before = comp.beforeArticle;
            const after = comp.afterArticle;
            const beforeText = comp.parsedBeforeText;
            const afterText = comp.parsedAfterText;
            const beforeHtml = comp.parsedBeforeHtml;
            const afterHtml = comp.parsedAfterHtml;
            const hasTable = comp.hasTable;

            return (
              <div key={comp.id} className="grid grid-cols-2">
                {/* 왼쪽: 이전 연혁 */}
                <div className="p-6 border-r border-slate-200 align-top overflow-x-auto">
                  {before ? (
                    <>
                      <div className="whitespace-pre-wrap text-[15.5px] leading-[1.7] text-slate-800 font-['Pretendard'] rule-viewer-content">
                        {hasTable ? (
                          <div dangerouslySetInnerHTML={{ __html: beforeHtml }} className="html-table-wrapper w-full break-keep" />
                        ) : (
                          renderDiff(beforeText, afterText, 'old')
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm font-bold">
                      [신설]
                    </div>
                  )}
                </div>
                {/* 오른쪽: 현재 연혁 */}
                <div className="p-6 align-top overflow-x-auto">
                  {after ? (
                    <>
                      <div className="whitespace-pre-wrap text-[15.5px] leading-[1.7] text-slate-800 font-['Pretendard'] rule-viewer-content">
                        {hasTable ? (
                          <div dangerouslySetInnerHTML={{ __html: afterHtml }} className="html-table-wrapper w-full break-keep" />
                        ) : (
                          renderDiff(beforeText, afterText, 'new')
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm font-bold">
                      [삭제]
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
