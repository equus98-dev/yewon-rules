const fs = require('fs');

const revisionId = '58ec6a1d-43b3-4131-a65a-12a2d5de73cf';

let sql = `
-- 1. 장 구분(chapter) 업데이트
UPDATE Article SET chapter = '제1장 총 칙' WHERE revisionId = '${revisionId}' AND articleNumber IN (1, 2, 3, 4);
UPDATE Article SET chapter = '제2장 대학기관 평가·인증' WHERE revisionId = '${revisionId}' AND articleNumber IN (5, 6, 7, 8, 9);
UPDATE Article SET chapter = '제3장 성과관리지표' WHERE revisionId = '${revisionId}' AND articleNumber = 10;
UPDATE Article SET chapter = '제4장 성과관리 절차' WHERE revisionId = '${revisionId}' AND articleNumber IN (11, 12, 13, 14, 15, 16, 17, 18);
UPDATE Article SET chapter = '제5장 성과관리 환류' WHERE revisionId = '${revisionId}' AND articleNumber IN (19, 20);
UPDATE Article SET chapter = '제6장 성과관리위원회' WHERE revisionId = '${revisionId}' AND articleNumber IN (21, 22, 23, 24, 25, 26);
UPDATE Article SET chapter = '제7장 보 칙' WHERE revisionId = '${revisionId}' AND articleNumber IN (27, 28, 29);
`;

const contentText = `제10조(성과관리지표 범위 및 담당부서) ① 성과관리지표 및 담당부서는 다음 각 호와 같다.
1. 교육성과관리 지표
가. 신입생충원율 : 입학지원팀
나. 재학생충원율 : 교무지원팀
다. 졸업생취업률 : 학생지원팀 (직제개편 : 2023.09.18)
라. 창업교과목 : 취업창업지원센터, 교무지원팀
마. 교육만족도 : 교육혁신팀 (직제개편 : 2023.09.18)
바. 비교과 프로그램 운영 
1) 학습역량강화 지원 : 교육혁신팀 (직제개편 : 2023.09.18)
2) 진로 및 심리상담 : 학생상담센터
3) 취창업 지원 : 취업창업지원센터
2. 연구성과관리 지표
가. 전임교원 1인당 논문(등재지, SCI급), 교외연구비, 교내연구비 : 기획조정팀
나. 교외연구비 : 산학협력단
3. 재정성과관리 지표
가. 교육비환원율 : 행정지원팀
나. 장학금지급률 : 학생지원팀 (직제개편 : 2023.09.18)
다. 세입중 등록금, 기부금, 법인전입금 비율 : 행정지원팀
4. 교육여건성과관리 지표
가. 전임교원확보율 : 교무지원팀
나. 교원확보율 : 교무지원팀
다. 교사확보율 : 행정지원팀
라. 전임교원 강의담당비율 : 교무지원팀
마. 강사 보수수준 : 교무지원팀, 기획조정팀
바. 강의규모의 적절성 : 교무지원팀
사. 기숙사 수용률 : 학생생활관
아. 직원 1인당 학생수 : 행정지원팀
자. 재학생 1인당 연간 자료구입비 : 정보도서관
차. 재학생 1,000명당 도서관 직원수 : 정보도서관
카. 재학생 1인당 실험·실습 기자재 구입비 : 행정지원팀, 교무지원팀
5. 평가성과관리 지표
가. 대학기관평가인증 : 성과관리팀 (직제개편 : 2023.09.18)
나. 대학자체평가 : 성과관리팀 (직제개편 : 2023.09.18)
다. 대학발전계획평가 : 성과관리팀 (직제개편 : 2023.09.18)
② 담당부서는 각종 평가에 대비하여 성과관리지표를 철저히 관리하여야 하며, 세부운영계획은 성과관리팀에서 수립하여 안내한다.`;

const contentJson = [
  { num: "제10조(성과관리지표 범위 및 담당부서)", text: "① 성과관리지표 및 담당부서는 다음 각 호와 같다.", type: "article" },
  { num: "1.", text: "교육성과관리 지표", type: "item" },
  { num: "가.", text: "신입생충원율 : 입학지원팀", type: "subitem" },
  { num: "나.", text: "재학생충원율 : 교무지원팀", type: "subitem" },
  { num: "다.", text: "졸업생취업률 : 학생지원팀 (직제개편 : 2023.09.18)", type: "subitem" },
  { num: "라.", text: "창업교과목 : 취업창업지원센터, 교무지원팀", type: "subitem" },
  { num: "마.", text: "교육만족도 : 교육혁신팀 (직제개편 : 2023.09.18)", type: "subitem" },
  { num: "바.", text: "비교과 프로그램 운영", type: "subitem" },
  { num: "1)", text: "학습역량강화 지원 : 교육혁신팀 (직제개편 : 2023.09.18)", type: "subitem" },
  { num: "2)", text: "진로 및 심리상담 : 학생상담센터", type: "subitem" },
  { num: "3)", text: "취창업 지원 : 취업창업지원센터", type: "subitem" },
  { num: "2.", text: "연구성과관리 지표", type: "item" },
  { num: "가.", text: "전임교원 1인당 논문(등재지, SCI급), 교외연구비, 교내연구비 : 기획조정팀", type: "subitem" },
  { num: "나.", text: "교외연구비 : 산학협력단", type: "subitem" },
  { num: "3.", text: "재정성과관리 지표", type: "item" },
  { num: "가.", text: "교육비환원율 : 행정지원팀", type: "subitem" },
  { num: "나.", text: "장학금지급률 : 학생지원팀 (직제개편 : 2023.09.18)", type: "subitem" },
  { num: "다.", text: "세입중 등록금, 기부금, 법인전입금 비율 : 행정지원팀", type: "subitem" },
  { num: "4.", text: "교육여건성과관리 지표", type: "item" },
  { num: "가.", text: "전임교원확보율 : 교무지원팀", type: "subitem" },
  { num: "나.", text: "교원확보율 : 교무지원팀", type: "subitem" },
  { num: "다.", text: "교사확보율 : 행정지원팀", type: "subitem" },
  { num: "라.", text: "전임교원 강의담당비율 : 교무지원팀", type: "subitem" },
  { num: "마.", text: "강사 보수수준 : 교무지원팀, 기획조정팀", type: "subitem" },
  { num: "바.", text: "강의규모의 적절성 : 교무지원팀", type: "subitem" },
  { num: "사.", text: "기숙사 수용률 : 학생생활관", type: "subitem" },
  { num: "아.", text: "직원 1인당 학생수 : 행정지원팀", type: "subitem" },
  { num: "자.", text: "재학생 1인당 연간 자료구입비 : 정보도서관", type: "subitem" },
  { num: "차.", text: "재학생 1,000명당 도서관 직원수 : 정보도서관", type: "subitem" },
  { num: "카.", text: "재학생 1인당 실험·실습 기자재 구입비 : 행정지원팀, 교무지원팀", type: "subitem" },
  { num: "5.", text: "평가성과관리 지표", type: "item" },
  { num: "가.", text: "대학기관평가인증 : 성과관리팀 (직제개편 : 2023.09.18)", type: "subitem" },
  { num: "나.", text: "대학자체평가 : 성과관리팀 (직제개편 : 2023.09.18)", type: "subitem" },
  { num: "다.", text: "대학발전계획평가 : 성과관리팀 (직제개편 : 2023.09.18)", type: "subitem" },
  { num: "②", text: "담당부서는 각종 평가에 대비하여 성과관리지표를 철저히 관리하여야 하며, 세부운영계획은 성과관리팀에서 수립하여 안내한다.", type: "text" }
];

const contentTextEscaped = contentText.replace(/'/g, "''");
const contentJsonEscaped = JSON.stringify(contentJson).replace(/'/g, "''");

sql += `
-- 2. 제10조 각호 아래 가나다라마 세부 규정 업데이트
UPDATE Article SET contentText = '${contentTextEscaped}', contentJson = '${contentJsonEscaped}' WHERE revisionId = '${revisionId}' AND articleNumber = 10;
`;

fs.writeFileSync('update_3_1_21.sql', sql, 'utf-8');
console.log("Successfully generated update_3_1_21.sql");
