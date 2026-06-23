const text = "제19조의5 (대학평의원회의 기능) 평의원회는 각 호의 사항을 심의한다. 다만, 제3호, 제4호, 및 제6호는 자문한다. <개정 2008. 7. 16.> 1. 대학의 발전계획안에 관한 사항";

const regex = /(?<!\d+(?:의\d+)?\.\s*)(?<!\d)(\d{1,2}(?:의\d+)?\.)\s+(?=[^\d])/g;

const replaced = text.replace(regex, (match, p1, offset, string) => {
  const before = string.slice(0, offset);
  if (offset === 0 || before.match(/(?:^|\n)\s*$/)) return match;
  return '\n' + p1 + ' ';
});

console.log("ORIGINAL:", text);
console.log("REPLACED:", replaced);
