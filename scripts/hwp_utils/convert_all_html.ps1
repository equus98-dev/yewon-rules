$OutputEncoding = [console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding
$hwp = New-Object -ComObject HWPFrame.HwpObject
$hwp.RegisterModule("FilePathCheckDLL", "SecurityModule")
$hwp.XHwpWindows.Item(0).Visible = $false
$outDir = "E:\예원예술대학교_규정관리시스템\scratch\hwp_html"
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir }
Write-Host "Converting 0-0-0_제규정목차.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\0-0-0_제규정목차.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\0-0-0_제규정목차.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\0-0-0_제규정목차.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\0-0-0_제규정목차.hwp" }
Write-Host "Converting 1-0-1_학교법인_예원예술대학교_정관.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\1-0-1_학교법인_예원예술대학교_정관.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\1-0-1_학교법인_예원예술대학교_정관.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\1-0-1_학교법인_예원예술대학교_정관.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\1-0-1_학교법인_예원예술대학교_정관.hwp" }
Write-Host "Converting 1-0-2_학교법인_예원예술대학교_정관_시행규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\1-0-2_학교법인_예원예술대학교_정관_시행규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\1-0-2_학교법인_예원예술대학교_정관_시행규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\1-0-2_학교법인_예원예술대학교_정관_시행규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\1-0-2_학교법인_예원예술대학교_정관_시행규정.hwp" }
Write-Host "Converting 1-0-3_대학구조개혁협의회_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\1-0-3_대학구조개혁협의회_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\1-0-3_대학구조개혁협의회_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\1-0-3_대학구조개혁협의회_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\1-0-3_대학구조개혁협의회_규정.hwp" }
Write-Host "Converting 1-0-4_교원_징계규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\1-0-4_교원_징계규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\1-0-4_교원_징계규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\1-0-4_교원_징계규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\1-0-4_교원_징계규정.hwp" }
Write-Host "Converting 1-0-5_일반직원_징계규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\1-0-5_일반직원_징계규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\1-0-5_일반직원_징계규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\1-0-5_일반직원_징계규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\1-0-5_일반직원_징계규정.hwp" }
Write-Host "Converting 1-0-6_학교법인_감사규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\1-0-6_학교법인_감사규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\1-0-6_학교법인_감사규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\1-0-6_학교법인_감사규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\1-0-6_학교법인_감사규정.hwp" }
Write-Host "Converting 2-0-10_성인학습자_학사_운영규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-10_성인학습자_학사_운영규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-10_성인학습자_학사_운영규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\2-0-10_성인학습자_학사_운영규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-10_성인학습자_학사_운영규정.hwp" }
Write-Host "Converting 2-0-1_대학헌장.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-1_대학헌장.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-1_대학헌장.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\2-0-1_대학헌장.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-1_대학헌장.hwp" }
Write-Host "Converting 2-0-2_예원예술대학교_학칙.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-2_예원예술대학교_학칙.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-2_예원예술대학교_학칙.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\2-0-2_예원예술대학교_학칙.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-2_예원예술대학교_학칙.hwp" }
Write-Host "Converting 2-0-3_학업이수에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-3_학업이수에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-3_학업이수에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\2-0-3_학업이수에_관한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-3_학업이수에_관한_규정.hwp" }
Write-Host "Converting 2-0-4_대학원_학칙.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-4_대학원_학칙.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-4_대학원_학칙.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\2-0-4_대학원_학칙.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-4_대학원_학칙.hwp" }
Write-Host "Converting 2-0-5_문화예술대학원_학사운영_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-5_문화예술대학원_학사운영_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-5_문화예술대학원_학사운영_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\2-0-5_문화예술대학원_학사운영_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-5_문화예술대학원_학사운영_규정.hwp" }
Write-Host "Converting 2-0-6_사회복지대학원_학사운영_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-6_사회복지대학원_학사운영_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-6_사회복지대학원_학사운영_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\2-0-6_사회복지대학원_학사운영_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-6_사회복지대학원_학사운영_규정.hwp" }
Write-Host "Converting 2-0-7_문화영상창업대학원_학사운영_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-7_문화영상창업대학원_학사운영_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-7_문화영상창업대학원_학사운영_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\2-0-7_문화영상창업대학원_학사운영_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-7_문화영상창업대학원_학사운영_규정.hwp" }
Write-Host "Converting 2-0-8_대학원_권리장전_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-8_대학원_권리장전_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-8_대학원_권리장전_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\2-0-8_대학원_권리장전_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-8_대학원_권리장전_규정.hwp" }
Write-Host "Converting 2-0-9_일반대학원_학사운영_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-9_일반대학원_학사운영_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-9_일반대학원_학사운영_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\2-0-9_일반대학원_학사운영_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-9_일반대학원_학사운영_규정.hwp" }
Write-Host "Converting 3-1-10_보안업무_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-10_보안업무_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-10_보안업무_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-1-10_보안업무_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-10_보안업무_규정.hwp" }
Write-Host "Converting 3-1-11_당직근무수칙.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-11_당직근무수칙.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-11_당직근무수칙.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-1-11_당직근무수칙.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-11_당직근무수칙.hwp" }
Write-Host "Converting 3-1-12_직인관리_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-12_직인관리_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-12_직인관리_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-1-12_직인관리_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-12_직인관리_규정.hwp" }
Write-Host "Converting 3-1-13_지식재산권_관리규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-13_지식재산권_관리규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-13_지식재산권_관리규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-1-13_지식재산권_관리규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-13_지식재산권_관리규정.hwp" }
Write-Host "Converting 3-1-14_교육_및_교육지원시설에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-14_교육_및_교육지원시설에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-14_교육_및_교육지원시설에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-1-14_교육_및_교육지원시설에_관한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-14_교육_및_교육지원시설에_관한_규정.hwp" }
Write-Host "Converting 3-1-15_물품(비품실험실습기자재)에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-15_물품(비품실험실습기자재)에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-15_물품(비품실험실습기자재)에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-1-15_물품(비품실험실습기자재)에_관한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-15_물품(비품실험실습기자재)에_관한_규정.hwp" }
Write-Host "Converting 3-1-16_화재예방_및_전기설비_안전관리_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-16_화재예방_및_전기설비_안전관리_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-16_화재예방_및_전기설비_안전관리_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-1-16_화재예방_및_전기설비_안전관리_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-16_화재예방_및_전기설비_안전관리_규정.hwp" }
Write-Host "Converting 3-1-17_실험실습실_안전관리_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-17_실험실습실_안전관리_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-17_실험실습실_안전관리_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-1-17_실험실습실_안전관리_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-17_실험실습실_안전관리_규정.hwp" }
Write-Host "Converting 3-1-18_연구실_안전관리_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-18_연구실_안전관리_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-18_연구실_안전관리_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-1-18_연구실_안전관리_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-18_연구실_안전관리_규정.hwp" }
Write-Host "Converting 3-1-19_차량관리_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-19_차량관리_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-19_차량관리_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-1-19_차량관리_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-19_차량관리_규정.hwp" }
Write-Host "Converting 3-1-1_직제_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-1_직제_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-1_직제_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-1-1_직제_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-1_직제_규정.hwp" }
Write-Host "Converting 3-1-20_전자문서_운영에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-20_전자문서_운영에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-20_전자문서_운영에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-1-20_전자문서_운영에_관한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-20_전자문서_운영에_관한_규정.hwp" }
Write-Host "Converting 3-1-23_교육_만족도_조사에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-23_교육_만족도_조사에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-23_교육_만족도_조사에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-1-23_교육_만족도_조사에_관한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-23_교육_만족도_조사에_관한_규정.hwp" }
Write-Host "Converting 3-1-24_대학발전기금_관리_및_운영_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-24_대학발전기금_관리_및_운영_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-24_대학발전기금_관리_및_운영_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-1-24_대학발전기금_관리_및_운영_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-24_대학발전기금_관리_및_운영_규정.hwp" }
Write-Host "Converting 3-1-2_제규정_관리_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-2_제규정_관리_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-2_제규정_관리_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-1-2_제규정_관리_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-2_제규정_관리_규정.hwp" }
Write-Host "Converting 3-1-3_사무분장_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-3_사무분장_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-3_사무분장_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-1-3_사무분장_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-3_사무분장_규정.hwp" }
Write-Host "Converting 3-1-4_위임전결_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-4_위임전결_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-4_위임전결_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-1-4_위임전결_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-4_위임전결_규정.hwp" }
Write-Host "Converting 3-1-5_대학_자체평가_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-5_대학_자체평가_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-5_대학_자체평가_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-1-5_대학_자체평가_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-5_대학_자체평가_규정.hwp" }
Write-Host "Converting 3-1-6_감사규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-6_감사규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-6_감사규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-1-6_감사규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-6_감사규정.hwp" }
Write-Host "Converting 3-1-7_정보공개에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-7_정보공개에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-7_정보공개에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-1-7_정보공개에_관한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-7_정보공개에_관한_규정.hwp" }
Write-Host "Converting 3-1-8_문서관리_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-8_문서관리_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-8_문서관리_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-1-8_문서관리_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-8_문서관리_규정.hwp" }
Write-Host "Converting 3-1-9_문서의_보관_및_보존에_관한_시행_세칙.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-9_문서의_보관_및_보존에_관한_시행_세칙.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-9_문서의_보관_및_보존에_관한_시행_세칙.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-1-9_문서의_보관_및_보존에_관한_시행_세칙.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-9_문서의_보관_및_보존에_관한_시행_세칙.hwp" }
Write-Host "Converting 3-2-10_비정년계열_외국인교원_임용세칙.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-10_비정년계열_외국인교원_임용세칙.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-10_비정년계열_외국인교원_임용세칙.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-2-10_비정년계열_외국인교원_임용세칙.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-10_비정년계열_외국인교원_임용세칙.hwp" }
Write-Host "Converting 3-2-11_비정년계열_전임교원_인사규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-11_비정년계열_전임교원_인사규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-11_비정년계열_전임교원_인사규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-2-11_비정년계열_전임교원_인사규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-11_비정년계열_전임교원_인사규정.hwp" }
Write-Host "Converting 3-2-12_교원업적평가_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-12_교원업적평가_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-12_교원업적평가_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-2-12_교원업적평가_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-12_교원업적평가_규정.hwp" }
Write-Host "Converting 3-2-13_교원해외파견_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-13_교원해외파견_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-13_교원해외파견_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-2-13_교원해외파견_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-13_교원해외파견_규정.hwp" }
Write-Host "Converting 3-2-14_전임교원의_교내겸직에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-14_전임교원의_교내겸직에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-14_전임교원의_교내겸직에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-2-14_전임교원의_교내겸직에_관한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-14_전임교원의_교내겸직에_관한_규정.hwp" }
Write-Host "Converting 3-2-15_연구년제_운영규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-15_연구년제_운영규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-15_연구년제_운영규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-2-15_연구년제_운영규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-15_연구년제_운영규정.hwp" }
Write-Host "Converting 3-2-16_조교임용에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-16_조교임용에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-16_조교임용에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-2-16_조교임용에_관한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-16_조교임용에_관한_규정.hwp" }
Write-Host "Converting 3-2-17_직원인사규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-17_직원인사규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-17_직원인사규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-2-17_직원인사규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-17_직원인사규정.hwp" }
Write-Host "Converting 3-2-18_일반직원_인사평가_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-18_일반직원_인사평가_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-18_일반직원_인사평가_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-2-18_일반직원_인사평가_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-18_일반직원_인사평가_규정.hwp" }
Write-Host "Converting 3-2-19_계약직원_인사규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-19_계약직원_인사규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-19_계약직원_인사규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-2-19_계약직원_인사규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-19_계약직원_인사규정.hwp" }
Write-Host "Converting 3-2-1_교원인사규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-1_교원인사규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-1_교원인사규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-2-1_교원인사규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-1_교원인사규정.hwp" }
Write-Host "Converting 3-2-20_교직원_명예ㆍ희망퇴직_및_수당지급에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-20_교직원_명예ㆍ희망퇴직_및_수당지급에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-20_교직원_명예ㆍ희망퇴직_및_수당지급에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-2-20_교직원_명예ㆍ희망퇴직_및_수당지급에_관한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-20_교직원_명예ㆍ희망퇴직_및_수당지급에_관한_규정.hwp" }
Write-Host "Converting 3-2-21_교직원_복무_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-21_교직원_복무_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-21_교직원_복무_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-2-21_교직원_복무_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-21_교직원_복무_규정.hwp" }
Write-Host "Converting 3-2-22_교직원_외국여행에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-22_교직원_외국여행에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-22_교직원_외국여행에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-2-22_교직원_외국여행에_관한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-22_교직원_외국여행에_관한_규정.hwp" }
Write-Host "Converting 3-2-23_교직원포상_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-23_교직원포상_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-23_교직원포상_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-2-23_교직원포상_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-23_교직원포상_규정.hwp" }
Write-Host "Converting 3-2-24_연구윤리_진실성_검증_및_처리에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-24_연구윤리_진실성_검증_및_처리에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-24_연구윤리_진실성_검증_및_처리에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-2-24_연구윤리_진실성_검증_및_처리에_관한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-24_연구윤리_진실성_검증_및_처리에_관한_규정.hwp" }
Write-Host "Converting 3-2-26-1_교직원_동호회_활동지원_시행세칙.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-26-1_교직원_동호회_활동지원_시행세칙.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-26-1_교직원_동호회_활동지원_시행세칙.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-2-26-1_교직원_동호회_활동지원_시행세칙.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-26-1_교직원_동호회_활동지원_시행세칙.hwp" }
Write-Host "Converting 3-2-26_교직원_복지규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-26_교직원_복지규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-26_교직원_복지규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-2-26_교직원_복지규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-26_교직원_복지규정.hwp" }
Write-Host "Converting 3-2-2_객원교수에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-2_객원교수에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-2_객원교수에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-2-2_객원교수에_관한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-2_객원교수에_관한_규정.hwp" }
Write-Host "Converting 3-2-3_겸임교원에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-3_겸임교원에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-3_겸임교원에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-2-3_겸임교원에_관한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-3_겸임교원에_관한_규정.hwp" }
Write-Host "Converting 3-2-4_명예교수에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-4_명예교수에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-4_명예교수에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-2-4_명예교수에_관한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-4_명예교수에_관한_규정.hwp" }
Write-Host "Converting 3-2-5_석좌교수에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-5_석좌교수에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-5_석좌교수에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-2-5_석좌교수에_관한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-5_석좌교수에_관한_규정.hwp" }
Write-Host "Converting 3-2-6_특임교수에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-6_특임교수에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-6_특임교수에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-2-6_특임교수에_관한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-6_특임교수에_관한_규정.hwp" }
Write-Host "Converting 3-2-7_강사에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-7_강사에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-7_강사에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-2-7_강사에_관한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-7_강사에_관한_규정.hwp" }
Write-Host "Converting 3-2-8_교원_신규임용_세칙.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-8_교원_신규임용_세칙.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-8_교원_신규임용_세칙.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-2-8_교원_신규임용_세칙.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-8_교원_신규임용_세칙.hwp" }
Write-Host "Converting 3-2-9_교원_특별채용에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-9_교원_특별채용에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-9_교원_특별채용에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-2-9_교원_특별채용에_관한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-9_교원_특별채용에_관한_규정.hwp" }
Write-Host "Converting 3-3-10_계약학과_등_운영_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-10_계약학과_등_운영_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-10_계약학과_등_운영_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-10_계약학과_등_운영_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-10_계약학과_등_운영_규정.hwp" }
Write-Host "Converting 3-3-11_시간제교육_운영규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-11_시간제교육_운영규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-11_시간제교육_운영규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-11_시간제교육_운영규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-11_시간제교육_운영규정.hwp" }
Write-Host "Converting 3-3-12_전문가과정_운영_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-12_전문가과정_운영_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-12_전문가과정_운영_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-12_전문가과정_운영_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-12_전문가과정_운영_규정.hwp" }
Write-Host "Converting 3-3-13_학력증명서발급규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-13_학력증명서발급규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-13_학력증명서발급규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-13_학력증명서발급규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-13_학력증명서발급규정.hwp" }
Write-Host "Converting 3-3-14_학생현장실습(인턴)규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-14_학생현장실습(인턴)규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-14_학생현장실습(인턴)규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-14_학생현장실습(인턴)규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-14_학생현장실습(인턴)규정.hwp" }
Write-Host "Converting 3-3-15_대학입학전형의_선행학습영향평가_운영규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-15_대학입학전형의_선행학습영향평가_운영규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-15_대학입학전형의_선행학습영향평가_운영규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-15_대학입학전형의_선행학습영향평가_운영규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-15_대학입학전형의_선행학습영향평가_운영규정.hwp" }
Write-Host "Converting 3-3-16_편입학시행규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-16_편입학시행규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-16_편입학시행규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-16_편입학시행규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-16_편입학시행규정.hwp" }
Write-Host "Converting 3-3-17_휴학처리규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-17_휴학처리규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-17_휴학처리규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-17_휴학처리규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-17_휴학처리규정.hwp" }
Write-Host "Converting 3-3-18_외국대학과_복수(공동)학위_운영_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-18_외국대학과_복수(공동)학위_운영_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-18_외국대학과_복수(공동)학위_운영_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-18_외국대학과_복수(공동)학위_운영_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-18_외국대학과_복수(공동)학위_운영_규정.hwp" }
Write-Host "Converting 3-3-19_외국인_유학생_관리에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-19_외국인_유학생_관리에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-19_외국인_유학생_관리에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-19_외국인_유학생_관리에_관한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-19_외국인_유학생_관리에_관한_규정.hwp" }
Write-Host "Converting 3-3-1_수업관리규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-1_수업관리규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-1_수업관리규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-1_수업관리규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-1_수업관리규정.hwp" }
Write-Host "Converting 3-3-20_원격수업_운영에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-20_원격수업_운영에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-20_원격수업_운영에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-20_원격수업_운영에_관한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-20_원격수업_운영에_관한_규정.hwp" }
Write-Host "Converting 3-3-21_교수_자녀_간_강의수강_및_성적평가에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-21_교수_자녀_간_강의수강_및_성적평가에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-21_교수_자녀_간_강의수강_및_성적평가에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-21_교수_자녀_간_강의수강_및_성적평가에_관한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-21_교수_자녀_간_강의수강_및_성적평가에_관한_규정.hwp" }
Write-Host "Converting 3-3-22_강의평가_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-22_강의평가_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-22_강의평가_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-22_강의평가_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-22_강의평가_규정.hwp" }
Write-Host "Converting 3-3-23_비교과_교육과정_운영_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-23_비교과_교육과정_운영_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-23_비교과_교육과정_운영_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-23_비교과_교육과정_운영_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-23_비교과_교육과정_운영_규정.hwp" }
Write-Host "Converting 3-3-24_명예학사학위_수여에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-24_명예학사학위_수여에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-24_명예학사학위_수여에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-24_명예학사학위_수여에_관한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-24_명예학사학위_수여에_관한_규정.hwp" }
Write-Host "Converting 3-3-25_교육과정_운영규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-25_교육과정_운영규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-25_교육과정_운영규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-25_교육과정_운영규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-25_교육과정_운영규정.hwp" }
Write-Host "Converting 3-3-26_마이크로디그리_운영규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-26_마이크로디그리_운영규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-26_마이크로디그리_운영규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-26_마이크로디그리_운영규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-26_마이크로디그리_운영규정.hwp" }
Write-Host "Converting 3-3-27_폐과교원에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-27_폐과교원에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-27_폐과교원에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-27_폐과교원에_관한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-27_폐과교원에_관한_규정.hwp" }
Write-Host "Converting 3-3-28_조기취업자에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-28_조기취업자에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-28_조기취업자에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-28_조기취업자에_관한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-28_조기취업자에_관한_규정.hwp" }
Write-Host "Converting 3-3-29_모듈형_트렉제_운영_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-29_모듈형_트렉제_운영_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-29_모듈형_트렉제_운영_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-29_모듈형_트렉제_운영_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-29_모듈형_트렉제_운영_규정.hwp" }
Write-Host "Converting 3-3-2_복수전공_및_부전공에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-2_복수전공_및_부전공에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-2_복수전공_및_부전공에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-2_복수전공_및_부전공에_관한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-2_복수전공_및_부전공에_관한_규정.hwp" }
Write-Host "Converting 3-3-30_집중이수제에_대한_시행_세칙.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-30_집중이수제에_대한_시행_세칙.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-30_집중이수제에_대한_시행_세칙.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-30_집중이수제에_대한_시행_세칙.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-30_집중이수제에_대한_시행_세칙.hwp" }
Write-Host "Converting 3-3-31_체육계열_외부수업_지원금_지급_세칙.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-31_체육계열_외부수업_지원금_지급_세칙.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-31_체육계열_외부수업_지원금_지급_세칙.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-31_체육계열_외부수업_지원금_지급_세칙.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-31_체육계열_외부수업_지원금_지급_세칙.hwp" }
Write-Host "Converting 3-3-32_일반대학원_박사학위_협동과정_운영세칙.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-32_일반대학원_박사학위_협동과정_운영세칙.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-32_일반대학원_박사학위_협동과정_운영세칙.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-32_일반대학원_박사학위_협동과정_운영세칙.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-32_일반대학원_박사학위_협동과정_운영세칙.hwp" }
Write-Host "Converting 3-3-3_실험실습비_운영규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-3_실험실습비_운영규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-3_실험실습비_운영규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-3_실험실습비_운영규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-3_실험실습비_운영규정.hwp" }
Write-Host "Converting 3-3-4_전임교원_책임시수_및_강의료_지급규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-4_전임교원_책임시수_및_강의료_지급규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-4_전임교원_책임시수_및_강의료_지급규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-4_전임교원_책임시수_및_강의료_지급규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-4_전임교원_책임시수_및_강의료_지급규정.hwp" }
Write-Host "Converting 3-3-5_졸업논문_및_졸업종합시험_운영규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-5_졸업논문_및_졸업종합시험_운영규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-5_졸업논문_및_졸업종합시험_운영규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-5_졸업논문_및_졸업종합시험_운영규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-5_졸업논문_및_졸업종합시험_운영규정.hwp" }
Write-Host "Converting 3-3-6_국내외_대학(원)에서의_교과목이수와_학점인정에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-6_국내외_대학(원)에서의_교과목이수와_학점인정에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-6_국내외_대학(원)에서의_교과목이수와_학점인정에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-6_국내외_대학(원)에서의_교과목이수와_학점인정에_관한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-6_국내외_대학(원)에서의_교과목이수와_학점인정에_관한_규정.hwp" }
Write-Host "Converting 3-3-7_예비대학생학점인정규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-7_예비대학생학점인정규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-7_예비대학생학점인정규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-7_예비대학생학점인정규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-7_예비대학생학점인정규정.hwp" }
Write-Host "Converting 3-3-8_외국인_유학생_선발_시행_세칙.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-8_외국인_유학생_선발_시행_세칙.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-8_외국인_유학생_선발_시행_세칙.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-8_외국인_유학생_선발_시행_세칙.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-8_외국인_유학생_선발_시행_세칙.hwp" }
Write-Host "Converting 3-3-9_학과(전공)_경쟁력_확보에_관한_내규-2022.04.19_폐지.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-9_학과(전공)_경쟁력_확보에_관한_내규-2022.04.19_폐지.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-9_학과(전공)_경쟁력_확보에_관한_내규-2022.04.19_폐지.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-3-9_학과(전공)_경쟁력_확보에_관한_내규-2022.04.19_폐지.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-9_학과(전공)_경쟁력_확보에_관한_내규-2022.04.19_폐지.hwp" }
Write-Host "Converting 3-4-10_보건진료소운영_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-10_보건진료소운영_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-10_보건진료소운영_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-4-10_보건진료소운영_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-10_보건진료소운영_규정.hwp" }
Write-Host "Converting 3-4-11_사회봉사센터_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-11_사회봉사센터_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-11_사회봉사센터_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-4-11_사회봉사센터_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-11_사회봉사센터_규정.hwp" }
Write-Host "Converting 3-4-12_커리어개발센터규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-12_커리어개발센터규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-12_커리어개발센터규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-4-12_커리어개발센터규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-12_커리어개발센터규정.hwp" }
Write-Host "Converting 3-4-13_교수학습지원센터_운영규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-13_교수학습지원센터_운영규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-13_교수학습지원센터_운영규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-4-13_교수학습지원센터_운영규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-13_교수학습지원센터_운영규정.hwp" }
Write-Host "Converting 3-4-14_학생종합서비스센터_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-14_학생종합서비스센터_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-14_학생종합서비스센터_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-4-14_학생종합서비스센터_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-14_학생종합서비스센터_규정.hwp" }
Write-Host "Converting 3-4-15_지도교수제_시행세칙.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-15_지도교수제_시행세칙.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-15_지도교수제_시행세칙.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-4-15_지도교수제_시행세칙.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-15_지도교수제_시행세칙.hwp" }
Write-Host "Converting 3-4-18_소수_집단_학생_지원_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-18_소수_집단_학생_지원_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-18_소수_집단_학생_지원_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-4-18_소수_집단_학생_지원_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-18_소수_집단_학생_지원_규정.hwp" }
Write-Host "Converting 3-4-19_학생복지시설운영_및_관리규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-19_학생복지시설운영_및_관리규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-19_학생복지시설운영_및_관리규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-4-19_학생복지시설운영_및_관리규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-19_학생복지시설운영_및_관리규정.hwp" }
Write-Host "Converting 3-4-1_장학금지급규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-1_장학금지급규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-1_장학금지급규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-4-1_장학금지급규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-1_장학금지급규정.hwp" }
Write-Host "Converting 3-4-2_근로장학제도_운영규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-2_근로장학제도_운영규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-2_근로장학제도_운영규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-4-2_근로장학제도_운영규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-2_근로장학제도_운영규정.hwp" }
Write-Host "Converting 3-4-3_학생준칙.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-3_학생준칙.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-3_학생준칙.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-4-3_학생준칙.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-3_학생준칙.hwp" }
Write-Host "Converting 3-4-4_동아리_등록과_운영에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-4_동아리_등록과_운영에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-4_동아리_등록과_운영에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-4-4_동아리_등록과_운영에_관한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-4_동아리_등록과_운영에_관한_규정.hwp" }
Write-Host "Converting 3-4-5_학생단체등록·운영에관한규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-5_학생단체등록·운영에관한규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-5_학생단체등록·운영에관한규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-4-5_학생단체등록·운영에관한규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-5_학생단체등록·운영에관한규정.hwp" }
Write-Host "Converting 3-4-6_성희롱,성폭력_예방을_위한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-6_성희롱,성폭력_예방을_위한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-6_성희롱,성폭력_예방을_위한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-4-6_성희롱,성폭력_예방을_위한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-6_성희롱,성폭력_예방을_위한_규정.hwp" }
Write-Host "Converting 3-4-7_장애학생지원센터규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-7_장애학생지원센터규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-7_장애학생지원센터규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-4-7_장애학생지원센터규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-7_장애학생지원센터규정.hwp" }
Write-Host "Converting 3-4-8_학생상벌에관한규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-8_학생상벌에관한규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-8_학생상벌에관한규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-4-8_학생상벌에관한규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-8_학생상벌에관한규정.hwp" }
Write-Host "Converting 3-4-9_학생홍보(간행)물에관한세칙.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-9_학생홍보(간행)물에관한세칙.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-9_학생홍보(간행)물에관한세칙.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-4-9_학생홍보(간행)물에관한세칙.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-9_학생홍보(간행)물에관한세칙.hwp" }
Write-Host "Converting 3-5-10_교직원_수당_지급_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-10_교직원_수당_지급_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-10_교직원_수당_지급_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-5-10_교직원_수당_지급_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-10_교직원_수당_지급_규정.hwp" }
Write-Host "Converting 3-5-11_업무추진비_지급_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-11_업무추진비_지급_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-11_업무추진비_지급_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-5-11_업무추진비_지급_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-11_업무추진비_지급_규정.hwp" }
Write-Host "Converting 3-5-12_교직원_특별성과급_지급_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-12_교직원_특별성과급_지급_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-12_교직원_특별성과급_지급_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-5-12_교직원_특별성과급_지급_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-12_교직원_특별성과급_지급_규정.hwp" }
Write-Host "Converting 3-5-13_발전기금_유치_공헌자_인센티브_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-13_발전기금_유치_공헌자_인센티브_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-13_발전기금_유치_공헌자_인센티브_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-5-13_발전기금_유치_공헌자_인센티브_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-13_발전기금_유치_공헌자_인센티브_규정.hwp" }
Write-Host "Converting 3-5-1_재무회계규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-1_재무회계규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-1_재무회계규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-5-1_재무회계규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-1_재무회계규정.hwp" }
Write-Host "Converting 3-5-2_교외연구비_관리규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-2_교외연구비_관리규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-2_교외연구비_관리규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-5-2_교외연구비_관리규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-2_교외연구비_관리규정.hwp" }
Write-Host "Converting 3-5-3_연구기금관리규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-3_연구기금관리규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-3_연구기금관리규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-5-3_연구기금관리규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-3_연구기금관리규정.hwp" }
Write-Host "Converting 3-5-4-1_교원연봉제_세칙.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-4-1_교원연봉제_세칙.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-4-1_교원연봉제_세칙.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-5-4-1_교원연봉제_세칙.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-4-1_교원연봉제_세칙.hwp" }
Write-Host "Converting 3-5-4_교원연봉제_운영규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-4_교원연봉제_운영규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-4_교원연봉제_운영규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-5-4_교원연봉제_운영규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-4_교원연봉제_운영규정.hwp" }
Write-Host "Converting 3-5-5-1_직원연봉제_세칙.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-5-1_직원연봉제_세칙.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-5-1_직원연봉제_세칙.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-5-5-1_직원연봉제_세칙.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-5-1_직원연봉제_세칙.hwp" }
Write-Host "Converting 3-5-5_직원연봉제_운영규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-5_직원연봉제_운영규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-5_직원연봉제_운영규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-5-5_직원연봉제_운영규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-5_직원연봉제_운영규정.hwp" }
Write-Host "Converting 3-5-6_교직원_여비지급_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-6_교직원_여비지급_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-6_교직원_여비지급_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-5-6_교직원_여비지급_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-6_교직원_여비지급_규정.hwp" }
Write-Host "Converting 3-5-7_시설공사입찰및계약에관한내규.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-7_시설공사입찰및계약에관한내규.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-7_시설공사입찰및계약에관한내규.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-5-7_시설공사입찰및계약에관한내규.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-7_시설공사입찰및계약에관한내규.hwp" }
Write-Host "Converting 3-5-8_제증명수수료규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-8_제증명수수료규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-8_제증명수수료규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-5-8_제증명수수료규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-8_제증명수수료규정.hwp" }
Write-Host "Converting 3-5-9_교내학술연구비_관리_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-9_교내학술연구비_관리_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-9_교내학술연구비_관리_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\3-5-9_교내학술연구비_관리_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-9_교내학술연구비_관리_규정.hwp" }
Write-Host "Converting 4-0-10_대학발전후원회규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-10_대학발전후원회규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-10_대학발전후원회규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\4-0-10_대학발전후원회규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-10_대학발전후원회규정.hwp" }
Write-Host "Converting 4-0-11_대학평의원회운영규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-11_대학평의원회운영규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-11_대학평의원회운영규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\4-0-11_대학평의원회운영규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-11_대학평의원회운영규정.hwp" }
Write-Host "Converting 4-0-12_등록금심의위원회_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-12_등록금심의위원회_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-12_등록금심의위원회_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\4-0-12_등록금심의위원회_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-12_등록금심의위원회_규정.hwp" }
Write-Host "Converting 4-0-13_산학협력단_운영위원회_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-13_산학협력단_운영위원회_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-13_산학협력단_운영위원회_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\4-0-13_산학협력단_운영위원회_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-13_산학협력단_운영위원회_규정.hwp" }
Write-Host "Converting 4-0-14_산학협력위원회규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-14_산학협력위원회규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-14_산학협력위원회규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\4-0-14_산학협력위원회규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-14_산학협력위원회규정.hwp" }
Write-Host "Converting 4-0-15_학술위원회_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-15_학술위원회_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-15_학술위원회_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\4-0-15_학술위원회_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-15_학술위원회_규정.hwp" }
Write-Host "Converting 4-0-16_입시공정관리대책위원회규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-16_입시공정관리대책위원회규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-16_입시공정관리대책위원회규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\4-0-16_입시공정관리대책위원회규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-16_입시공정관리대책위원회규정.hwp" }
Write-Host "Converting 4-0-17_입시홍보위원회규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-17_입시홍보위원회규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-17_입시홍보위원회규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\4-0-17_입시홍보위원회규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-17_입시홍보위원회규정.hwp" }
Write-Host "Converting 4-0-18_입학전형관리위원회규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-18_입학전형관리위원회규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-18_입학전형관리위원회규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\4-0-18_입학전형관리위원회규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-18_입학전형관리위원회규정.hwp" }
Write-Host "Converting 4-0-19_커리어개발위원회규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-19_커리어개발위원회규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-19_커리어개발위원회규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\4-0-19_커리어개발위원회규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-19_커리어개발위원회규정.hwp" }
Write-Host "Converting 4-0-1_위원회설치규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-1_위원회설치규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-1_위원회설치규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\4-0-1_위원회설치규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-1_위원회설치규정.hwp" }
Write-Host "Converting 4-0-20_학생정원조정위원회규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-20_학생정원조정위원회규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-20_학생정원조정위원회규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\4-0-20_학생정원조정위원회규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-20_학생정원조정위원회규정.hwp" }
Write-Host "Converting 4-0-21_학생종합복지위원회규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-21_학생종합복지위원회규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-21_학생종합복지위원회규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\4-0-21_학생종합복지위원회규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-21_학생종합복지위원회규정.hwp" }
Write-Host "Converting 4-0-22_학위검증위원회_운영_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-22_학위검증위원회_운영_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-22_학위검증위원회_운영_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\4-0-22_학위검증위원회_운영_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-22_학위검증위원회_운영_규정.hwp" }
Write-Host "Converting 4-0-25_직원인사위원회_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-25_직원인사위원회_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-25_직원인사위원회_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\4-0-25_직원인사위원회_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-25_직원인사위원회_규정.hwp" }
Write-Host "Converting 4-0-26_원격수업관리위원회_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-26_원격수업관리위원회_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-26_원격수업관리위원회_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\4-0-26_원격수업관리위원회_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-26_원격수업관리위원회_규정.hwp" }
Write-Host "Converting 4-0-2_개방이사추천위원회운영규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-2_개방이사추천위원회운영규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-2_개방이사추천위원회운영규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\4-0-2_개방이사추천위원회운영규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-2_개방이사추천위원회운영규정.hwp" }
Write-Host "Converting 4-0-3_교무위원회규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-3_교무위원회규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-3_교무위원회규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\4-0-3_교무위원회규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-3_교무위원회규정.hwp" }
Write-Host "Converting 4-0-4_교원업적평가위원회규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-4_교원업적평가위원회규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-4_교원업적평가위원회규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\4-0-4_교원업적평가위원회규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-4_교원업적평가위원회규정.hwp" }
Write-Host "Converting 4-0-5_교원인사위원회규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-5_교원인사위원회규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-5_교원인사위원회규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\4-0-5_교원인사위원회규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-5_교원인사위원회규정.hwp" }
Write-Host "Converting 4-0-6_교육과정위원회_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-6_교육과정위원회_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-6_교육과정위원회_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\4-0-6_교육과정위원회_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-6_교육과정위원회_규정.hwp" }
Write-Host "Converting 4-0-7_규정심의위원회규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-7_규정심의위원회규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-7_규정심의위원회규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\4-0-7_규정심의위원회규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-7_규정심의위원회규정.hwp" }
Write-Host "Converting 4-0-8_기자재선정위원회규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-8_기자재선정위원회규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-8_기자재선정위원회규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\4-0-8_기자재선정위원회규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-8_기자재선정위원회규정.hwp" }
Write-Host "Converting 4-0-9_기획ㆍ연구위원회규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-9_기획ㆍ연구위원회규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-9_기획ㆍ연구위원회규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\4-0-9_기획ㆍ연구위원회규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-9_기획ㆍ연구위원회규정.hwp" }
Write-Host "Converting 5-1-10_문화예술창업보육센터규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-10_문화예술창업보육센터규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-10_문화예술창업보육센터규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-1-10_문화예술창업보육센터규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-10_문화예술창업보육센터규정.hwp" }
Write-Host "Converting 5-1-11_문화예술창업보육센터운영세칙.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-11_문화예술창업보육센터운영세칙.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-11_문화예술창업보육센터운영세칙.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-1-11_문화예술창업보육센터운영세칙.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-11_문화예술창업보육센터운영세칙.hwp" }
Write-Host "Converting 5-1-12_영재교육원_운영규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-12_영재교육원_운영규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-12_영재교육원_운영규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-1-12_영재교육원_운영규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-12_영재교육원_운영규정.hwp" }
Write-Host "Converting 5-1-13_게임교육센터_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-13_게임교육센터_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-13_게임교육센터_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-1-13_게임교육센터_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-13_게임교육센터_규정.hwp" }
Write-Host "Converting 5-1-14_국제예술교육연구소_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-14_국제예술교육연구소_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-14_국제예술교육연구소_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-1-14_국제예술교육연구소_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-14_국제예술교육연구소_규정.hwp" }
Write-Host "Converting 5-1-1_학생생활관_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-1_학생생활관_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-1_학생생활관_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-1-1_학생생활관_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-1_학생생활관_규정.hwp" }
Write-Host "Converting 5-1-2-1_교직원_숙소_운영_세칙.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-2-1_교직원_숙소_운영_세칙.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-2-1_교직원_숙소_운영_세칙.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-1-2-1_교직원_숙소_운영_세칙.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-2-1_교직원_숙소_운영_세칙.hwp" }
Write-Host "Converting 5-1-2_학생생활관_관생생활_수칙.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-2_학생생활관_관생생활_수칙.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-2_학생생활관_관생생활_수칙.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-1-2_학생생활관_관생생활_수칙.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-2_학생생활관_관생생활_수칙.hwp" }
Write-Host "Converting 5-1-3_평생교육원_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-3_평생교육원_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-3_평생교육원_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-1-3_평생교육원_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-3_평생교육원_규정.hwp" }
Write-Host "Converting 5-1-4_평생교육사과정_운영규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-4_평생교육사과정_운영규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-4_평생교육사과정_운영규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-1-4_평생교육사과정_운영규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-4_평생교육사과정_운영규정.hwp" }
Write-Host "Converting 5-1-5_원격평생교육원_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-5_원격평생교육원_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-5_원격평생교육원_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-1-5_원격평생교육원_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-5_원격평생교육원_규정.hwp" }
Write-Host "Converting 5-1-6_정보도서관_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-6_정보도서관_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-6_정보도서관_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-1-6_정보도서관_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-6_정보도서관_규정.hwp" }
Write-Host "Converting 5-1-7_신문방송국규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-7_신문방송국규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-7_신문방송국규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-1-7_신문방송국규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-7_신문방송국규정.hwp" }
Write-Host "Converting 5-1-8_국제교류협력단_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-8_국제교류협력단_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-8_국제교류협력단_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-1-8_국제교류협력단_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-8_국제교류협력단_규정.hwp" }
Write-Host "Converting 5-1-9_문화예술교육원_운영규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-9_문화예술교육원_운영규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-9_문화예술교육원_운영규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-1-9_문화예술교육원_운영규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-9_문화예술교육원_운영규정.hwp" }
Write-Host "Converting 5-2-10_스포츠산업연구소_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-10_스포츠산업연구소_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-10_스포츠산업연구소_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-2-10_스포츠산업연구소_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-10_스포츠산업연구소_규정.hwp" }
Write-Host "Converting 5-2-11_국제_TSG연구소_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-11_국제_TSG연구소_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-11_국제_TSG연구소_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-2-11_국제_TSG연구소_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-11_국제_TSG연구소_규정.hwp" }
Write-Host "Converting 5-2-12_뷰티생활문화연구소_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-12_뷰티생활문화연구소_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-12_뷰티생활문화연구소_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-2-12_뷰티생활문화연구소_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-12_뷰티생활문화연구소_규정.hwp" }
Write-Host "Converting 5-2-13_공연예술연구소_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-13_공연예술연구소_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-13_공연예술연구소_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-2-13_공연예술연구소_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-13_공연예술연구소_규정.hwp" }
Write-Host "Converting 5-2-14_디자인콘텐츠연구소_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-14_디자인콘텐츠연구소_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-14_디자인콘텐츠연구소_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-2-14_디자인콘텐츠연구소_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-14_디자인콘텐츠연구소_규정.hwp" }
Write-Host "Converting 5-2-15_인권센터_운영규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-15_인권센터_운영규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-15_인권센터_운영규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-2-15_인권센터_운영규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-15_인권센터_운영규정.hwp" }
Write-Host "Converting 5-2-1_부설연구소_설치_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-1_부설연구소_설치_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-1_부설연구소_설치_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-2-1_부설연구소_설치_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-1_부설연구소_설치_규정.hwp" }
Write-Host "Converting 5-2-2_학생상담센터_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-2_학생상담센터_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-2_학생상담센터_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-2-2_학생상담센터_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-2_학생상담센터_규정.hwp" }
Write-Host "Converting 5-2-3_전통가구콘텐츠연구소_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-3_전통가구콘텐츠연구소_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-3_전통가구콘텐츠연구소_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-2-3_전통가구콘텐츠연구소_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-3_전통가구콘텐츠연구소_규정.hwp" }
Write-Host "Converting 5-2-4_천연염색문화연구소규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-4_천연염색문화연구소규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-4_천연염색문화연구소규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-2-4_천연염색문화연구소규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-4_천연염색문화연구소규정.hwp" }
Write-Host "Converting 5-2-5_예술정보산업연구소_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-5_예술정보산업연구소_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-5_예술정보산업연구소_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-2-5_예술정보산업연구소_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-5_예술정보산업연구소_규정.hwp" }
Write-Host "Converting 5-2-6_문화산업연구소_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-6_문화산업연구소_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-6_문화산업연구소_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-2-6_문화산업연구소_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-6_문화산업연구소_규정.hwp" }
Write-Host "Converting 5-2-7_AI_콘텐츠_연구소_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-7_AI_콘텐츠_연구소_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-7_AI_콘텐츠_연구소_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-2-7_AI_콘텐츠_연구소_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-7_AI_콘텐츠_연구소_규정.hwp" }
Write-Host "Converting 5-2-8_지역문화융합연구소_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-8_지역문화융합연구소_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-8_지역문화융합연구소_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-2-8_지역문화융합연구소_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-8_지역문화융합연구소_규정.hwp" }
Write-Host "Converting 5-2-9_섬유패션디자인연구소_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-9_섬유패션디자인연구소_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-9_섬유패션디자인연구소_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\5-2-9_섬유패션디자인연구소_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-2-9_섬유패션디자인연구소_규정.hwp" }
Write-Host "Converting 6-0-10_RISE_사업단_운영세칙.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-10_RISE_사업단_운영세칙.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-10_RISE_사업단_운영세칙.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\6-0-10_RISE_사업단_운영세칙.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-10_RISE_사업단_운영세칙.hwp" }
Write-Host "Converting 6-0-1_산학협력단_법인정관.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-1_산학협력단_법인정관.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-1_산학협력단_법인정관.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\6-0-1_산학협력단_법인정관.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-1_산학협력단_법인정관.hwp" }
Write-Host "Converting 6-0-2_산학협력단_운영규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-2_산학협력단_운영규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-2_산학협력단_운영규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\6-0-2_산학협력단_운영규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-2_산학협력단_운영규정.hwp" }
Write-Host "Converting 6-0-3_산학협력단_간접비_사용_내규.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-3_산학협력단_간접비_사용_내규.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-3_산학협력단_간접비_사용_내규.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\6-0-3_산학협력단_간접비_사용_내규.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-3_산학협력단_간접비_사용_내규.hwp" }
Write-Host "Converting 6-0-4_산학협력단_산업자문_운영_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-4_산학협력단_산업자문_운영_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-4_산학협력단_산업자문_운영_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\6-0-4_산학협력단_산업자문_운영_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-4_산학협력단_산업자문_운영_규정.hwp" }
Write-Host "Converting 6-0-5_특별사업단_설립_운영_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-5_특별사업단_설립_운영_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-5_특별사업단_설립_운영_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\6-0-5_특별사업단_설립_운영_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-5_특별사업단_설립_운영_규정.hwp" }
Write-Host "Converting 6-0-6_학교기업_설치운영규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-6_학교기업_설치운영규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-6_학교기업_설치운영규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\6-0-6_학교기업_설치운영규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-6_학교기업_설치운영규정.hwp" }
Write-Host "Converting 6-0-7_미래비전사업단_운영규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-7_미래비전사업단_운영규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-7_미래비전사업단_운영규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\6-0-7_미래비전사업단_운영규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-7_미래비전사업단_운영규정.hwp" }
Write-Host "Converting 6-0-8_산학협력단_간접비_관리운영_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-8_산학협력단_간접비_관리운영_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-8_산학협력단_간접비_관리운영_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\6-0-8_산학협력단_간접비_관리운영_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-8_산학협력단_간접비_관리운영_규정.hwp" }
Write-Host "Converting 6-0-9_RISE_사업단_관리운영에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-9_RISE_사업단_관리운영에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-9_RISE_사업단_관리운영에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\6-0-9_RISE_사업단_관리운영에_관한_규정.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\6-0-9_RISE_사업단_관리운영에_관한_규정.hwp" }
Write-Host "Converting 7-0-1_학생회칙.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\7-0-1_학생회칙.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\7-0-1_학생회칙.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\7-0-1_학생회칙.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\7-0-1_학생회칙.hwp" }
Write-Host "Converting 7-0-2_학부과_입학정원조정_및_학과구조조정_규정-2022.04.19.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\7-0-2_학부과_입학정원조정_및_학과구조조정_규정-2022.04.19.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\7-0-2_학부과_입학정원조정_및_학과구조조정_규정-2022.04.19.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\7-0-2_학부과_입학정원조정_및_학과구조조정_규정-2022.04.19.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\7-0-2_학부과_입학정원조정_및_학과구조조정_규정-2022.04.19.hwp" }
Write-Host "Converting 9-9-1716_장기근속수당_기준표.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\9-9-1716_장기근속수당_기준표.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\9-9-1716_장기근속수당_기준표.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\9-9-1716_장기근속수당_기준표.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\9-9-1716_장기근속수당_기준표.hwp" }
Write-Host "Converting test.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\test.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\test.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_html\test.hwp.htm', "HTML", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\test.hwp" }
$hwp.Quit()