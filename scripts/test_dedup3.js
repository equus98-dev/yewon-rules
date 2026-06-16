const lines = [
  "제1조(시행일) 이 학칙은 2009년 01월 06일부터 시행한다.",
  "이 학칙은 2009년 01월 06일부터 시행한다."
];

const newLines = [];
const seenCoreTexts = new Set();

for (let i = 0; i < lines.length; i++) {
  const currentLine = lines[i].trim();
  if (currentLine === "") continue;
  
  if (i < lines.length - 1) {
    const nextLine = lines[i+1].trim();
    if (/^(?:부칙\s*)?제\d+조(?:의\s*\d+)?\s*\(.*?\)$/.test(currentLine)) {
      if (nextLine.startsWith(currentLine)) {
        continue; 
      }
    }
  }

  let coreText = currentLine;
  const match1 = currentLine.match(/^(?:부칙\s*)?제\d+조(?:의\s*\d+)?\s*\([^)]*\)\s*(.*)/);
  if (match1) {
    coreText = match1[1].trim();
  } else {
    const match2 = currentLine.match(/^(?:부칙\s*)?제\d+조(?:의\s*\d+)?\s+(.*)/);
    if (match2) coreText = match2[1].trim();
  }

  coreText = coreText.replace(/^[①-⑮\d]+\.\s*/, '').trim();

  if (coreText && coreText.length > 10) {
    let isDuplicate = false;
    if (!/^(?:부칙\s*)?제\d+조/.test(currentLine)) {
      for (const seen of seenCoreTexts) {
        if (seen.includes(coreText)) {
          isDuplicate = true;
          break;
        }
      }
    }
    if (isDuplicate) {
      console.log(`Skipping duplicate: ${currentLine}`);
      continue;
    }
    seenCoreTexts.add(coreText);
  }
  
  newLines.push(currentLine);
}
console.log('Result:', newLines);
