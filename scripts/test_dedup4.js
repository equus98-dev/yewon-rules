const lines = [
  "제1조(시행일) 이 학칙은 2009년 01월 06일부터 시행한다.",
  "이 학칙은 2009년 01월 06일부터 시행한다."
];

const newLines = [];
const seenCoreTexts = new Set();

const normalize = (s) => s.replace(/\s+/g, '').replace(/[.·]/g, '');

for (let i = 0; i < lines.length; i++) {
  const currentLine = lines[i].trim();
  if (currentLine === "") continue;
  
  // ...
  let coreText = currentLine;
  const match1 = currentLine.match(/^(?:부칙\s*)?제\d+조(?:의\s*\d+)?\s*\([^)]*\)\s*(.*)/);
  if (match1) {
    coreText = match1[1].trim();
  } else {
    const match2 = currentLine.match(/^(?:부칙\s*)?제\d+조(?:의\s*\d+)?\s+(.*)/);
    if (match2) coreText = match2[1].trim();
  }

  coreText = coreText.replace(/^[①-⑮\d]+\.\s*/, '').trim();
  const normalizedCore = normalize(coreText);

  if (normalizedCore && normalizedCore.length > 5) {
    let isDuplicate = false;
    if (!/^(?:부칙\s*)?제\d+조/.test(currentLine)) {
      for (const seen of seenCoreTexts) {
        if (seen.includes(normalizedCore) || normalizedCore.includes(seen)) {
          isDuplicate = true;
          break;
        }
      }
    }
    if (isDuplicate) {
      console.log(`Skipping duplicate: ${currentLine}`);
      continue;
    }
    seenCoreTexts.add(normalizedCore);
  }
  
  newLines.push(currentLine);
}
console.log('Result:', newLines);
