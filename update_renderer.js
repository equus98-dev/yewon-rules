const fs = require('fs');
let code = fs.readFileSync('src/components/ArticleRenderer.tsx', 'utf8');

// 1. Add currentIndent state
code = code.replace(/let curHang = "";\s*let curHo = "";\s*let curMok = "";/, 
    'let curHang = "";\n    let curHo = "";\n    let curMok = "";\n    let currentIndent = isArticleBody ? "40px" : "0px";');

code = code.replace(/curHo = ""; curMok = "";/g, 
    'curHo = ""; curMok = ""; currentIndent = isArticleBody ? "40px" : "72px";');

code = code.replace(/curMok = "";/g, 
    'curMok = ""; currentIndent = isArticleBody ? "56px" : "88px";');

code = code.replace(/curMok = `\$\{numMatch\[1\]\.replace\('\.', ''\)\}목`;/, 
    'curMok = `${numMatch[1].replace(\'.\', \'\')}목`; currentIndent = isArticleBody ? "72px" : "104px";');

// 2. Use currentIndent for continuation lines
code = code.replace(/} else \{\s*if \(isInline\) \{\s*lineClass \+= " font-normal text-slate-800";\s*\} else \{\s*lineClass \+= " block mt-1";\s*\}/,
    `} else {
             if (/^제\\d+장/.test(trimmed) || /^제\\d+(?:절|관)/.test(trimmed)) {
                 currentIndent = '0px';
             }
             if (isInline) {
                lineClass += " font-normal text-slate-800";
             } else {
                return (
                   <div key={\`glued-\${idx}\`} className={\`block w-full break-keep text-slate-800 py-0.5\`} style={{ paddingLeft: currentIndent }}>
                     {renderTextWithHistory(trimmed)}
                   </div>
                );
             }
          }`);

// 3. Fix contentHtml fallback: Use formatGluedText if no tables!
// We need to replace the dangerouslySetInnerHTML block:
/*
        <div 
          className={`mb-4 ql-editor ${wrapperClass} px-0 py-2 w-full`}
          dangerouslySetInnerHTML={{ __html: cleanHtml }}
        />
*/
// It appears like this in the file.
code = code.replace(/<div \s*className=\{\`mb-4 ql-editor \$\{wrapperClass\} px-0 py-2 w-full\`\}\s*dangerouslySetInnerHTML=\{\{ __html: cleanHtml \}\}\s*\/>/m,
    `{ (cleanHtml && !/<table/i.test(cleanHtml)) ? (
             <div className={\`mb-4 ql-editor \${wrapperClass} px-0 py-2 w-full\`}>
                 {formatGluedText(cleanHtml, true)}
             </div>
          ) : (
             <div className={\`mb-4 ql-editor \${wrapperClass} px-0 py-2 w-full\`} dangerouslySetInnerHTML={{ __html: cleanHtml }} />
          ) }`);


fs.writeFileSync('src/components/ArticleRenderer.tsx', code);
console.log('Successfully updated ArticleRenderer.tsx');
