const fs = require('fs');
const path = require('path');

const dir = 'F:\\예원예술대학교_규정관리시스템\\public\\attachments';
let failedFiles = [];

if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));
    for (const f of files) {
        const fullPath = path.join(dir, f);
        const stat = fs.statSync(fullPath);
        if (stat.size === 5152 || stat.size === 5153) {
            failedFiles.push(f.replace('.pdf', '.hwp'));
        }
    }
}

let content = `# ⚠️ 수동 변환이 필요한 파일 목록 (총 ${failedFiles.length}개)\n\n`;
content += `아래 목록은 자동화 스크립트 실행 시 **문서 보호, 매크로 팝업, 특수 포맷 등의 이유로 한글 프로그램이 열기를 차단하여 PDF 생성이 누락(백지 발생)된 HWP 원본 파일들**입니다.\n\n`;
content += `사용자님 PC의 한글(HWP) 프로그램에서 수동으로 열람하신 뒤 **[파일] -> [PDF로 저장하기]**를 눌러 PDF로 변환 후 수동 업로드해 주셔야 합니다.\n\n`;
content += `## 실패 목록\n`;
for (let i=0; i<failedFiles.length; i++) {
    content += `- [ ] \`${failedFiles[i]}\`\n`;
}

fs.writeFileSync('C:\\Users\\윈도우11\\.gemini\\antigravity\\brain\\8040ce2f-ed1d-4bc8-850c-539b76fd84ec\\failed_conversion_list.md', content, 'utf8');
console.log('Artifact created.');
