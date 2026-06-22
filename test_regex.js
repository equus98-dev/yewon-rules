const HISTORY_REGEX = /([<(\[＜（](?:개정|제정|신설|삭제|본조신설|전문개정|단서신설|후단신설|장\s*변경|조\s*폐지|변경|폐지|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?)(?:[^>\])＞）]*\d+[^>\])＞）]*|[\s]*)[>\])＞）])/gi;

console.log("Match 2026:", HISTORY_REGEX.test("<삭제 2026.02.24>"));
HISTORY_REGEX.lastIndex = 0;
console.log("Match 2022 space:", HISTORY_REGEX.test("<삭제 2022. 1. 24.>"));
HISTORY_REGEX.lastIndex = 0;
console.log("Match 2016:", HISTORY_REGEX.test("<개정 2016. 11. 17.>"));

// Let's test the parts split logic
const splitRegex = /(\[cite\s+rule="[^"]*"\s+article="[^"]*"(?:\s+url="[^"]*")?\][\s\S]*?\[\/cite\]|\[nocite\][\s\S]*?\[\/nocite\]|[<(](?:개정|제정|신설|삭제|본조신설|전문개정|단서신설|후단신설|변경|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?)[^>)]*[>)])/gi;
console.log("Split 2026:", "<삭제 2026.02.24>".split(splitRegex));
console.log("Split 2022:", "<삭제 2022. 1. 24.>".split(splitRegex));
console.log("Split 2016:", "<개정 2016. 11. 17.>".split(splitRegex));
