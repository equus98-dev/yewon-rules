const c = "제12조(전공폐지에 따른 경과조치) 경기드림캠퍼스 문화예술대학원 문화예술경영전공 재적(복학, 재입학, 수료 등) 할 수 없는 경우에는 전북희망캠퍼스 문화예술대학원 문화예술경영전공으로 본다.\n[별표 1] 대학원 입학정원표\n○ 대학원 입학정원(2026학년도)\n<table cellspacing=\"0\">\n<tbody><tr><td>test</td></tr></tbody></table>";

const clean = c.replace(/\s*([\[〔【<])\s*(별지|별표|서식|별첨)[\s\S]*$/, "").trim();
console.log(clean);
