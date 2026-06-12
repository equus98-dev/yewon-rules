const fs = require('fs');

function cleanRuleViewer() {
    let code = fs.readFileSync('src/components/RuleViewer.tsx', 'utf8');

    // 1. Remove isSelectMode prop
    code = code.replace(/isSelectMode\?: boolean;\n/, '');
    code = code.replace(/isSelectMode = false,\n/, '');

    // 2. Remove interfaces and state
    code = code.replace(/interface ManualCitationData \{[\s\S]*?\}\n/g, '');
    code = code.replace(/\s*const \[manualCitationData, setManualCitationData\] = useState<ManualCitationData \| null>\(null\);\n/, '');
    code = code.replace(/\s*const \[isManualModalOpen, setIsManualModalOpen\] = useState\(false\);\n/, '');
    code = code.replace(/\s*const \[isManualModalSaving, setIsManualModalSaving\] = useState\(false\);\n/, '');

    // 3. Remove popupState
    code = code.replace(/\s*const \[popupState, setPopupState\] = useState<\{[\s\S]*?\{ isOpen: false, title: "" \}\);\n/, '');

    // 4. Remove DraggablePopup import
    code = code.replace(/import DraggablePopup from '\.\/DraggablePopup';\n/, '');

    // 5. Remove handleGlobalClick
    const startGlobal = code.indexOf('const handleGlobalClick');
    if (startGlobal !== -1) {
        const endGlobal = code.indexOf('return () => document.removeEventListener(\'click\', handleGlobalClick);', startGlobal);
        if (endGlobal !== -1) {
            code = code.substring(0, startGlobal) + code.substring(endGlobal + 72);
        }
    }

    // 6. Remove handleMouseUp
    const startMouseUp = code.indexOf('const handleMouseUp = () => {');
    if (startMouseUp !== -1) {
        const endMouseUp = code.indexOf('if (!isManualModalOpen) setManualCitationData(null);', startMouseUp);
        if (endMouseUp !== -1) {
            // Find the closing brace for handleMouseUp
            const closingBrace = code.indexOf('};', endMouseUp);
            if (closingBrace !== -1) {
                code = code.substring(0, startMouseUp) + code.substring(closingBrace + 2);
            }
        }
    }
    code = code.replace(/onMouseUp=\{handleMouseUp\}/, '');

    // 7. Remove handleRemoveCitation
    const startRemoveCit = code.indexOf('const handleRemoveCitation = async () => {');
    if (startRemoveCit !== -1) {
        const endRemoveCit = code.indexOf('setIsManualModalSaving(false);', startRemoveCit);
        if (endRemoveCit !== -1) {
            const closingBrace = code.indexOf('};', endRemoveCit);
            if (closingBrace !== -1) {
                code = code.substring(0, startRemoveCit) + code.substring(closingBrace + 2);
            }
        }
    }

    // 8. Remove handleManualCitationSave
    const startSaveCit = code.indexOf('const handleManualCitationSave = async (targetRuleId');
    if (startSaveCit !== -1) {
        const endSaveCit = code.indexOf('setIsManualModalSaving(false);', startSaveCit);
        if (endSaveCit !== -1) {
            const closingBrace = code.indexOf('};', endSaveCit);
            if (closingBrace !== -1) {
                code = code.substring(0, startSaveCit) + code.substring(closingBrace + 2);
            }
        }
    }

    // 9. Remove DraggablePopup JSX
    const startPopup = code.indexOf('<DraggablePopup');
    if (startPopup !== -1) {
        const endPopup = code.indexOf('</DraggablePopup>', startPopup);
        if (endPopup !== -1) {
            code = code.substring(0, startPopup) + code.substring(endPopup + 17);
        }
    }

    // 10. Remove isAdmin && manualCitationData modal
    const startModal = code.indexOf('{isAdmin && manualCitationData && !isManualModalOpen && (');
    if (startModal !== -1) {
        const endModal = code.indexOf('{isManualModalOpen && (', startModal);
        if (endModal !== -1) {
            code = code.substring(0, startModal) + code.substring(endModal);
        }
    }

    // 11. Remove isManualModalOpen JSX
    const startModal2 = code.indexOf('{isManualModalOpen && (');
    if (startModal2 !== -1) {
        const endModal2 = code.indexOf('{/* Scroll Buttons */}', startModal2);
        if (endModal2 !== -1) {
            code = code.substring(0, startModal2) + code.substring(endModal2);
        }
    }

    // 12. Remove ArticleRenderer props isSelectMode and ruleName
    code = code.replace(/isSelectMode=\{isSelectMode\}/g, '');
    code = code.replace(/ruleName=\{cleanTitle\}/g, '');

    fs.writeFileSync('src/components/RuleViewer.tsx', code);
    console.log("Cleaned RuleViewer");
}

cleanRuleViewer();
