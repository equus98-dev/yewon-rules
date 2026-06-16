const historyRegexPattern = /([<(\[＜（](?:개정|제정|신설|삭제|본조신설|전문개정|단서신설|후단신설|장\s*변경|조\s*폐지|변경|폐지|\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?)(?:[^>\])＞）]*\d+[^>\])＞）]*|[\s]*)[>\])＞）])/gi;

let text = "제17장 장애학생의 지원 등 <제정 2011.04.01>";

console.log("Original:", text);
console.log("Replaced:", text.replace(historyRegexPattern, '').trim());

