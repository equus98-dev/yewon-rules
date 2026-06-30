const fs = require('fs');
let text = fs.readFileSync('src/app/revision/[id]/RevisionClient.tsx', 'utf8');

text = text.replace(
  'const matchRevision = att.revisionId ? att.revisionId === currentRevId : isLatestRev;',
  'const oldestRevId = revisions[revisions.length - 1]?.id;\n    const matchRevision = att.revisionId ? att.revisionId === currentRevId : (currentRevId === oldestRevId);'
);

// We already removed "관리자 도구" from the table with the previous replace_file_content! Wait, the previous replace_file_content failed to apply properly?
// Let's remove the "관리자 도구" row if it's there.
const adminRowRegex = /\{\/\*\s*관리자 도구\s*\*\/\}\s*\{isAdmin && selectedRev && \(\s*<tr>[\s\S]*?<\/tr>\s*\)\}/g;
text = text.replace(adminRowRegex, '');

const adminToolsSnippet = `
      {/* 관리자 도구 (테이블 하단에 독립적으로 배치) */}
      {isAdmin && selectedRev && (
        <div className="flex flex-wrap gap-2 items-center mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-slate-600 font-black text-[13px] mr-2">⚙️ 관리자 도구</span>
          <button
            onClick={() => setIsCreatingRev(true)}
            className="text-[13px] flex-shrink-0 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer font-bold shadow-sm inline-flex items-center gap-1.5"
            title="새로운 연혁(과거 개정 이력) 추가"
          >
            ➕ 연혁 추가
          </button>
          {revisions.length > 1 && selectedRev?.id === revisions[0]?.id && (
            <button
              onClick={handleDeleteRevision}
              className="text-[13px] flex-shrink-0 bg-red-50 text-red-600 px-4 py-2 rounded-lg border border-red-200 hover:bg-red-100 transition-colors cursor-pointer font-bold shadow-sm inline-flex items-center gap-1.5"
              title="최신 연혁 삭제 (개정 취소)"
            >
              🗑️ 연혁 삭제
            </button>
          )}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".hwp,.pdf"
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-[13px] flex-shrink-0 bg-amber-50 text-amber-700 px-4 py-2 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer font-bold shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50"
            title="원문파일 업로드"
          >
            {isUploading ? "업로드 중..." : "📤 파일 첨부"}
          </button>
          {!isEditingDesc && (
            <button 
              onClick={() => { 
                setIsEditingDesc(true); 
                setEditDescText(selectedRev.description || ""); 
                setEditEnactDate(selectedRev.enactmentDate ? new Date(selectedRev.enactmentDate).toISOString().split('T')[0] : "");
                setEditEffDate(selectedRev.effectiveDate ? new Date(selectedRev.effectiveDate).toISOString().split('T')[0] : "");
              }}
              className="text-[13px] flex-shrink-0 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer font-bold shadow-sm inline-flex items-center gap-1.5"
              title="개정내용 및 날짜 편집"
            >
              ✏️ 편집
            </button>
          )}
        </div>
      )}
`;

if (!text.includes('관리자 도구 (테이블 하단에 독립적으로 배치)')) {
  text = text.replace('          </tbody>\n        </table>\n      </div>', '          </tbody>\n        </table>\n      </div>\n' + adminToolsSnippet);
}

fs.writeFileSync('src/app/revision/[id]/RevisionClient.tsx', text);
