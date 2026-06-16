const texts = [
  "② 이 학칙 시행당시",
  "1. 일반대학원",
  "제4조(협동과정 신설, 운영) 1. 일반대학원"
];

for (const t of texts) {
  let coreText = t;
  coreText = coreText.replace(/^[①-⑮\d]+[.)]?\s*/, '').trim();
  console.log(t, "->", coreText);
}
