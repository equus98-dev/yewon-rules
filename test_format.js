const text = "① 관생이 퇴사하는 경우에는 퇴사결정 일로부터 5일 이내에 공용물의 반납 확인을 받은 후 퇴사하여야 한다. ② ①항의 기간 내에 퇴사하지 않은 자의 사물은 임의 조치한다.";

let formatted = text
  .replace(/([①-⑳])/g, (match, p1, offset, string) => {
    const before = string.slice(0, offset);
    const after = string.slice(offset + 1);
    if (/(?:^|\n)제\d+조(?:의\d+)?\s*(?:\[.*\]|\(.*\)|\〔.*\〕)?\s*$/.test(before)) return match;
    if (/(?:제|\(|,|및|또는|와|과|이나|나)\s*$/.test(before)) return match;
    if (/^\s*(?:항|호)/.test(after)) return match;
    if (offset === 0 || before.endsWith('\n')) return match;
    return '\n' + match;
  });

console.log(formatted);
