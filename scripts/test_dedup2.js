const lines = [
  "제1조(시행일) 이 학칙은 2025년 12월 09일부터 시행한다.",
  "제2조(학위과정 폐지) 일반대학원 스포츠경영전공 석·박사학위과정, 박사학위과정을 폐지한다.",
  "제12조(전공폐지에 따른 경과조치) 경기드림캠퍼스 문화예술대학원 문화예술경영전공으로 본다.",
  "이 학칙은 2025년 12월 09일부터 시행한다.",
  "일반대학원 스포츠경영전공 석·박사학위과정, 박사학위과정을 폐지한다.",
  "경기드림캠퍼스 문화예술대학원 문화예술경영전공으로 본다."
];

const newLines = [];
const seenTexts = new Set();

// Extract the core text without the article title prefix
function getCoreText(line) {
  const match = line.match(/^(?:부칙\s*)?제\d+조(?:의\s*\d+)?\s*\([^)]*\)\s*(.*)/);
  if (match) return match[1].trim();
  
  // What if there is no parenthesis in title?
  const match2 = line.match(/^(?:부칙\s*)?제\d+조(?:의\s*\d+)?\s+(.*)/);
  if (match2) return match2[1].trim();
  
  return line.trim();
}

for (const line of lines) {
  const core = getCoreText(line);
  if (!core) {
    newLines.push(line);
    continue;
  }
  
  // If we already saw this core text, or if this core text is a substring of any previously seen core text, skip it!
  // Wait, if line is exactly the core text (meaning it has NO header), and we ALREADY saw it WITH a header!
  let isDuplicate = false;
  if (!/^(?:부칙\s*)?제\d+조/.test(line)) {
    // This line doesn't have a header.
    for (const seen of seenTexts) {
      if (seen.includes(core)) {
        isDuplicate = true;
        break;
      }
    }
  }
  
  if (!isDuplicate) {
    newLines.push(line);
    seenTexts.add(core);
  }
}

console.log(newLines.join('\n'));
