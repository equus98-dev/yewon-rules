const fs = require('fs');
let code = fs.readFileSync('src/components/ArticleRenderer.tsx', 'utf8');
code = code.replace(/\r\n/g, '\n');

// 1. Hoist functions
code = code.replace(
    'const renderTextWithHistory = (text: string) => {',
    'function renderTextWithHistory(text: string) {'
);
code = code.replace(
    'const formatGluedText = (text: string, isArticleBody: boolean = false): React.ReactNode => {',
    'function formatGluedText(text: string, isArticleBody: boolean = false): React.ReactNode {'
);

// 2. Add currentIndent state in formatGluedText
code = code.replace(
    'let curHang = "";\n    let curHo = "";\n    let curMok = "";',
    'let curHang = "";\n    let curHo = "";\n    let curMok = "";\n    let currentIndent = isArticleBody ? "40px" : "0px";'
);

code = code.replace(
    /curHo = ""; curMok = "";\n\s*currentPath = `\$\{baseArticlePath\} \$\{curHang\}`\.trim\(\);/g,
    'curHo = ""; curMok = ""; currentIndent = isArticleBody ? "40px" : "72px";\n               currentPath = `${baseArticlePath} ${curHang}`.trim();'
);

code = code.replace(
    /curMok = "";\n\s*currentPath = `\$\{baseArticlePath\} \$\{curHang\} \$\{curHo\}`\.replace\(\/\\s\+\/g, ' '\)\.trim\(\);/g,
    'curMok = ""; currentIndent = isArticleBody ? "56px" : "88px";\n               currentPath = `${baseArticlePath} ${curHang} ${curHo}`.replace(/\\s+/g, \' \').trim();'
);

code = code.replace(
    /curMok = `\$\{numMatch\[1\]\.replace\('\.', ''\)\}목`;\n\s*currentPath = `\$\{baseArticlePath\} \$\{curHang\} \$\{curHo\} \$\{curMok\}`\.replace\(\/\\s\+\/g, ' '\)\.trim\(\);/g,
    'curMok = `${numMatch[1].replace(\'.\', \'\')}목`; currentIndent = isArticleBody ? "72px" : "104px";\n               currentPath = `${baseArticlePath} ${curHang} ${curHo} ${curMok}`.replace(/\\s+/g, \' \').trim();'
);

// 3. Update else block in formatGluedText
const elseBlockRegex = /\} else \{\n\s*if \(isInline\) \{\n\s*lineClass \+= " font-normal text-slate-800";\n\s*\} else \{\n\s*lineClass \+= " block mt-1";\n\s*\}\n\s*\}/;
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

// 4. Fallback to formatGluedText if no tables in contentHtml block
const divBlockRegex = /<div \n\s*className=\{\`mb-4 ql-editor \$\{wrapperClass\} px-0 py-2 w-full\`\}\n\s*dangerouslySetInnerHTML=\{\{ __html: cleanHtml \}\}\n\s*\/>/;
const newDivBlock = `{ (cleanHtml && !/<table/i.test(cleanHtml)) ? (
             <div className={\`mb-4 ql-editor \${wrapperClass} px-0 py-2 w-full\`}>
                 {formatGluedText(cleanHtml, true)}
             </div>
          ) : (
             <div className={\`mb-4 ql-editor \${wrapperClass} px-0 py-2 w-full\`} dangerouslySetInnerHTML={{ __html: cleanHtml }} />
          ) }`;
code = code.replace(divBlockRegex, newDivBlock);

// 5. Allow rendering HTML tags in renderTextWithHistory
const regexToReplace = /if \(\/<table\|<tr\|<td\|<th\|<br\|<p\/i\.test\(decodedText\)\) \{/;
const newRegex = `if (/<table|<tr|<td|<th|<br|<p|<span|<div|<img|<b|<strong|<i|<em|<u|<mark|<a|<ul|<ol|<li/i.test(decodedText)) {`;
code = code.replace(regexToReplace, newRegex);

fs.writeFileSync('src/components/ArticleRenderer.tsx', code);
console.log('Update script finished');
