const text = `제1조(시행일) 이 학칙은 2007년 5월 16일부터 시행한다.
제2조(학부(과) 변경 및 신설)
제2조(학부(과) 변경 및 신설) 2008학년도 입학생부터 다음 각 호와 같이 학부(과)를 변경 및 폐지한다.
1. 스포츠레저학부를 스포츠복지학부로 변경한다.
제3조(전공 변경 및 신설) 다음 각 호와 같이 전공을 변경 또는 신설하여 시행한다.
제4조(학부(과) 및 전공변경에 따른 경과조치)
제4조(학부(과) 및 전공변경에 따른 경과조치) ① 전조의 변경 이전에...
`;

let fullText = text;

// Find consecutive lines where the first line matches "제N조(...)" and the second line starts with the exact same text.
const lines = fullText.split('\n');
const newLines = [];
for (let i = 0; i < lines.length; i++) {
  const currentLine = lines[i].trim();
  if (currentLine === "") continue;
  
  if (i < lines.length - 1) {
    const nextLine = lines[i+1].trim();
    // If current line matches "제N조(...)" and next line starts with the current line
    if (/^(?:부칙\s*)?제\d+조(?:의\s*\d+)?\s*\(.*?\)$/.test(currentLine)) {
      if (nextLine.startsWith(currentLine)) {
        // Skip adding the current line because it's duplicated at the start of the next line
        continue;
      }
    }
  }
  newLines.push(currentLine);
}
fullText = newLines.join('\n');

console.log(fullText);
