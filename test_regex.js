const tests = [
  "부 칙\n1. (시행일) 이 정관은 2000년 12월 27일부터 시행한다.\n2. (교직원징계에 대한 경과조치) 이 정관 시행 당시 교직원징계원위원회에 계류중인 징계사건은 징계사유 발생 당시의 정관 규정에 의한다.",
  "부 칙\n① .(시행일) 이 정관은 2006년 12월 18일부터 시행한다.\n② .(임원 선임기간의 예외) ...",
  "부 칙(2001. 2. 28)\n1. (시행일) ...\n2. (준용) ..."
];

for (let t of tests) {
  let newContent = t.replace(/(부\s*칙(?:\([^)]+\))?)\s*/, "부칙\n");
  newContent = newContent.replace(/^\s*(?:\d+\.|[①-⑮]\s*\.?)\s*(?=\()/gm, "");
  console.log("-------------------");
  console.log("Original:\n" + t);
  console.log("\nNew:\n" + newContent);
}
