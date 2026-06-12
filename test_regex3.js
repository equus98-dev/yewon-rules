const text = '위원장은 제10조의 제2차 이 규정 제5조 학교법인 예원예술대학교 정관 제26조';
const regex = /(?:([가-힣]+(?:\s+[가-힣]+)*?(?:규정|정관|학칙|법|령|규칙|지침|내규|헌장))\s+)?(제\s*\d+\s*조(?:의\s*\d+)?(?:\s*제\s*\d+\s*항)?)/g;
let m;
while((m=regex.exec(text)) !== null) {
  console.log("Rule:", m[1], "Article:", m[2]);
}
