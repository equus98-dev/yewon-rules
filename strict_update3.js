const fs = require('fs');
let code = fs.readFileSync('src/components/ArticleRenderer.tsx', 'utf8');
code = code.replace(/\r\n/g, '\n');

// 1. Move contentHtml block to the end of formatGluedText
const blockStartIdx = code.indexOf('  if (contentHtml && contentHtml.trim().length > 0) {');
const endStr = '    );\n  }\n\n  let items: ContentItem[] = [];';
let blockEndIdx = code.indexOf(endStr);
if (blockEndIdx === -1) {
    blockEndIdx = code.indexOf('    );\n  }\n  let items: ContentItem[] = [];');
}
if (blockStartIdx !== -1 && blockEndIdx !== -1) {
    const block = code.substring(blockStartIdx, blockEndIdx + 6); // up to the end of '  }\n'
    code = code.substring(0, blockStartIdx) + code.substring(blockEndIdx + 6);
    const insertIdx = code.indexOf('  let displayItems = [...items];');
    code = code.substring(0, insertIdx) + block + '\n' + code.substring(insertIdx);
} else {
    console.log("Start:", blockStartIdx, "End:", blockEndIdx);
    throw new Error('Failed to find contentHtml block');
}

// 2. Add currentIndent state in formatGluedText
code = code.replace(
    'let curHang = "";\n    let curHo = "";\n    let curMok = "";',
    'let curHang = "";\n    let curHo = "";\n    let curMok = "";\n    let currentIndent = isArticleBody ? "40px" : "0px";'
);

code = code.replace(
    /curHo = ""; curMok = "";\n               currentPath = `\$\{baseArticlePath\} \$\{curHang\}`\.trim\(\);/,
    'curHo = ""; curMok = ""; currentIndent = isArticleBody ? "40px" : "72px";\n               currentPath = `${baseArticlePath} ${curHang}`.trim();'
);

code = code.replace(
    /curMok = "";\n               currentPath = `\$\{baseArticlePath\} \$\{curHang\} \$\{curHo\}`\.replace\(\/\\s\+\/g, ' '\)\.trim\(\);/,
    'curMok = ""; currentIndent = isArticleBody ? "56px" : "88px";\n               currentPath = `${baseArticlePath} ${curHang} ${curHo}`.replace(/\\s+/g, \' \').trim();'
);

code = code.replace(
    /curMok = `\$\{numMatch\[1\]\.replace\('\.', ''\)\}목`;\n               currentPath = `\$\{baseArticlePath\} \$\{curHang\} \$\{curHo\} \$\{curMok\}`\.replace\(\/\\s\+\/g, ' '\)\.trim\(\);/,
    'curMok = `${numMatch[1].replace(\'.\', \'\')}목`; currentIndent = isArticleBody ? "72px" : "104px";\n               currentPath = `${baseArticlePath} ${curHang} ${curHo} ${curMok}`.replace(/\\s+/g, \' \').trim();'
);

// 3. Update else block in formatGluedText
const elseBlockRegex = /\} else \{\s*if \(isInline\) \{\s*lineClass \+= " font-normal text-slate-800";\s*\} else \{\s*lineClass \+= " block mt-1";\s*\}\s*\}/;
const newElseBlock = `} else {
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
          }`;
code = code.replace(elseBlockRegex, newElseBlock);

// 4. Fallback to formatGluedText if no tables
const divBlockRegex = /<div \s*className=\{\`mb-4 ql-editor \$\{wrapperClass\} px-0 py-2 w-full\`\}\s*dangerouslySetInnerHTML=\{\{ __html: cleanHtml \}\}\s*\/>/;
const newDivBlock = `{ (cleanHtml && !/<table/i.test(cleanHtml)) ? (
             <div className={\`mb-4 ql-editor \${wrapperClass} px-0 py-2 w-full\`}>
                 {formatGluedText(cleanHtml, true)}
             </div>
          ) : (
             <div className={\`mb-4 ql-editor \${wrapperClass} px-0 py-2 w-full\`} dangerouslySetInnerHTML={{ __html: cleanHtml }} />
          ) }`;
code = code.replace(divBlockRegex, newDivBlock);

// 5. Allow rendering HTML tags in renderTextWithHistory
const regexToReplace = /if \(\/<table\|<tr\|<td\|<th\|<br\|<p\/i\.test\(htmlText\)\) \{/;
const newRegex = `if (/<table|<tr|<td|<th|<br|<p|<span|<div|<img|<b|<strong|<i|<em|<u|<mark|<a|<ul|<ol|<li/i.test(htmlText)) {`;
code = code.replace(regexToReplace, newRegex);

fs.writeFileSync('src/components/ArticleRenderer.tsx', code);
console.log('Update script finished');
