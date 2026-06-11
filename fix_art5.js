const fs = require('fs');
let html = fs.readFileSync('art5.html', 'utf8');

// 1. Shading the '교직원' cell
html = html.replace(
  /<td valign="middle" style="overflow:hidden;width:80px;height:124px;([^"]+)">\s*<p class="HStyle0" style="text-align:center;"><span style="position:relative">교직원<\/span><span class="hnc_page_break" style="display:relative;word-spacing:-0.5em;">&nbsp;<\/span><\/p>\s*<\/td>/, 
  '<td valign="middle" style="overflow:hidden;width:80px;height:124px;background-color:#f1f3f5;$1">\n\t<p class="HStyle0" style="text-align:center;"><span style="position:relative;font-weight:bold;">교직원</span></p>\n\t</td>'
);

// 2. Adjust column widths
html = html.replace(/<td valign="middle" style="overflow:hidden;width:110px;/g, '<td valign="middle" style="overflow:hidden;width:134px;');
html = html.replace(/<td rowspan="2" valign="middle" style="overflow:hidden;width:110px;/g, '<td rowspan="2" valign="middle" style="overflow:hidden;width:134px;');

html = html.replace(/<td valign="middle" style="overflow:hidden;width:57px;/g, '<td valign="middle" style="overflow:hidden;width:45px;');
html = html.replace(/<td rowspan="2" valign="middle" style="overflow:hidden;width:57px;/g, '<td rowspan="2" valign="middle" style="overflow:hidden;width:45px;');

// 3. Line breaks for 실비 1
html = html.replace(
  /<p class="HStyle0" style="text-align:center;"><span style="position:relative">실비<\/span><span class="hnc_page_break" style="display:relative;word-spacing:-0.5em;">&nbsp;<\/span><\/p>\s*<p class="HStyle0" style="text-align:center;"><span style="position:relative">\(상한액:서울특별시 100,000 \/ 광역시 80,000 \/ 그 밖의 지역 70,000\)<\/span><span class="hnc_page_break" style="display:relative;word-spacing:-0.5em;">&nbsp;<\/span><\/p>/,
  '<p class="HStyle0" style="text-align:center;line-height:1.6;"><span style="position:relative">실비</span><br><span style="position:relative">(상한액)</span><br><span style="position:relative">서울특별시 10만원</span><br><span style="position:relative">광역시 8만원</span><br><span style="position:relative">그 밖의 지역 7만원</span></p>'
);

// 4. Line breaks for 실비 2
html = html.replace(
  /<p class="HStyle0" style="text-align:center;"><span style="position:relative">실비<\/span><span class="hnc_page_break" style="display:relative;word-spacing:-0.5em;">&nbsp;<\/span><\/p>\s*<p class="HStyle0" style="text-align:center;"><span style="position:relative">\(철도: KTX일반실\)<\/span><span class="hnc_page_break" style="display:relative;word-spacing:-0.5em;">&nbsp;<\/span><\/p>\s*<p class="HStyle0" style="text-align:center;"><span style="position:relative">\(버스: 우등고속버스\)<\/span><span class="hnc_page_break" style="display:relative;word-spacing:-0.5em;">&nbsp;<\/span><\/p>\s*<p class="HStyle0" style="text-align:center;"><span style="position:relative">\(항공: 이코노미\)<\/span><span class="hnc_page_break" style="display:relative;word-spacing:-0.5em;">&nbsp;<\/span><\/p>/,
  '<p class="HStyle0" style="text-align:center;line-height:1.6;"><span style="position:relative">실비</span><br><span style="position:relative">철도: KTX일반실</span><br><span style="position:relative">버스: 우등고속버스</span><br><span style="position:relative">항공: 이코노미</span></p>'
);

fs.writeFileSync('art5_fixed.html', html);
console.log("Written to art5_fixed.html");
