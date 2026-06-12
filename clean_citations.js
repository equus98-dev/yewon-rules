const fs = require('fs');

function cleanArticleRenderer() {
    let code = fs.readFileSync('src/components/ArticleRenderer.tsx', 'utf8');

    // Remove isSelectMode from props definition
    code = code.replace(/\s*isSelectMode\?: boolean;/g, '');
    code = code.replace(/\s*ruleName\?: string;/g, '');
    code = code.replace(/\s*isSelectMode = false,/g, '');
    code = code.replace(/\s*ruleName = "",/g, '');

    // Replace the HTML replace blocks
    code = code.replace(/const citationRegexStr = [\s\S]*?\/\/\s*수동 인용 태그 파싱 \(HTML 처리용\)\n    htmlText = htmlText\.replace\(\/\\\[cite\\s\+rule="([^"]*)"\\s\+article="([^"]*)"\(\?:\\s\+url="([^"]*)"\)\?\\\]\(\[\\s\\S\]\*\?\)\\\[\\\/cite\\\]\/gi, \(match, rule, article, url, content\) => \{\n      const urlAttr = url \? ` data-url="\$\{url\}"` : "";\n      return `<a href="#" class="cited-article-link text-sky-700 font-bold underline underline-offset-2" data-rule-name="\$\{rule\}" data-article="\$\{article\}"\$\{urlAttr\}>\$\{content\}<\/a>`;\n    \}\);/g, 
`    // 잔존 인용 태그 제거 (텍스트만 보이게 처리)
    htmlText = htmlText.replace(/\\[cite\\s+rule="([^"]*)"\\s+article="([^"]*)"(?:\\s+url="([^"]*)")?\\]([\\s\\S]*?)\\[\\/cite\\]/gi, '$4');
    htmlText = htmlText.replace(/\\[nocite\\]([\\s\\S]*?)\\[\\/nocite\\]/gi, '$1');`
    );

    // HTML Table nocite replacement cleanup
    code = code.replace(/let hiddenNoCites: string\[\] = \[\];[\s\S]*?dangerouslySetInnerHTML=\{\{ __html: htmlText \}\} \n        \/>\n      \);/g, `return (
        <div 
          className="html-table-wrapper block w-full overflow-x-auto html-content-inline"
          dangerouslySetInnerHTML={{ __html: htmlText }} 
        />
      );`);

    // parts.map cited link removal
    code = code.replace(/if \(m\) \{\n          return \([\s\S]*?<\/a>\n          \);\n        \}/g, `if (m) {
          return <span key={i}>{m[4]}</span>;
        }`);

    // remove subparts logic
    code = code.replace(/const subParts: React\.ReactNode\[\] = \[\];[\s\S]*?return <React\.Fragment key=\{i\}>\{part\}<\/React\.Fragment>;/g, `return <React.Fragment key={i}>{part}</React.Fragment>;`);

    // Interactive parts
    code = code.replace(/const handleItemSelect = \([^)]*\) => \{[\s\S]*?\n    \};\n/g, '');
    code = code.replace(/const handleSelectClick = \(e: React\.MouseEvent\) => \{[\s\S]*?\n    \};\n/g, '');
    code = code.replace(/const InlineSelectBadge = \(\) => \{[\s\S]*?\n    \};\n/g, '');

    // onClick removal
    code = code.replace(/onClick=\{isSelectMode \? [^\}]+ : undefined\} /g, '');
    code = code.replace(/onClick=\{isSelectMode \? [^\}]+\} /g, '');

    // interactiveClass empty
    code = code.replace(/const interactiveClass = isSelectMode \? [^;]+;/g, 'const interactiveClass = "";');
    
    // empty lines of isSelectMode
    code = code.replace(/if \(!isSelectMode\) return(?: null)?;/g, '');

    fs.writeFileSync('src/components/ArticleRenderer.tsx', code);
    console.log("Cleaned ArticleRenderer");
}

function cleanRuleViewer() {
    let code = fs.readFileSync('src/components/RuleViewer.tsx', 'utf8');

    // Remove isSelectMode prop
    code = code.replace(/isSelectMode\?: boolean;/, '');
    code = code.replace(/isSelectMode = false,/, '');

    // Remove ManualCitationData interface and state
    code = code.replace(/interface ManualCitationData \{[\s\S]*?\}\n/g, '');
    code = code.replace(/const \[manualCitationData, setManualCitationData\] = useState<ManualCitationData \| null>\(null\);\n/g, '');
    code = code.replace(/const \[isManualModalOpen, setIsManualModalOpen\] = useState\(false\);\n/g, '');
    code = code.replace(/const \[isManualModalSaving, setIsManualModalSaving\] = useState\(false\);\n/g, '');

    // Remove handleGlobalClick
    code = code.replace(/const handleGlobalClick = async \(e: MouseEvent\) => \{[\s\S]*?\n    \};\n\n    document\.addEventListener\('click', handleGlobalClick\);\n    return \(\) => document\.removeEventListener\('click', handleGlobalClick\);/g, '');
    
    // Remove DraggablePopup import and component
    code = code.replace(/import DraggablePopup from '.\/DraggablePopup';\n/g, '');
    
    // Remove handleMouseUp
    code = code.replace(/const handleMouseUp = \(\) => \{[\s\S]*?\n  \};\n/g, '');
    code = code.replace(/onMouseUp=\{handleMouseUp\}/g, '');
    
    // Remove popupState entirely
    code = code.replace(/const \[popupState, setPopupState\] = useState[\s\S]*?\{ isOpen: false, title: "" \}\);\n/g, '');
    code = code.replace(/<DraggablePopup[\s\S]*?<\/DraggablePopup>\n/g, '');

    // Remove handleManualCitationSave and removeCitation
    code = code.replace(/const handleRemoveCitation = async \(\) => \{[\s\S]*?\n  \};\n/g, '');
    code = code.replace(/const handleManualCitationSave = async \(targetRuleId: string, ruleName: string, articleNum: string, isExternal: boolean = false, url: string = ""\) => \{[\s\S]*?\n  \};\n/g, '');

    // Remove modal HTML
    code = code.replace(/\{isManualModalOpen && \([\s\S]*?\}\)\}\n/g, '');

    // Remove props passed to ArticleRenderer
    code = code.replace(/isSelectMode=\{isSelectMode\}/g, '');
    code = code.replace(/ruleName=\{cleanTitle\}/g, '');

    fs.writeFileSync('src/components/RuleViewer.tsx', code);
    console.log("Cleaned RuleViewer");
}

cleanArticleRenderer();
cleanRuleViewer();
