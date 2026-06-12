const text = '정관 제26조 제1항에 규정된 학칙 제3조에 따라 이 규정 제5조를 준용한다.';
const regex = /(([가-힣]+(?:\s+[가-힣]+)?)\s+)?(제\s*\d+\s*조(?:의\s*\d+)?(?:\s*제\s*\d+\s*항)?)/g;
let m;
while((m = regex.exec(text)) !== null) {
  console.log('Context:', m[2], 'Article:', m[3]);
}
