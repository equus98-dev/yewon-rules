$OutputEncoding = [console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding
$hwp = New-Object -ComObject HWPFrame.HwpObject
$hwp.RegisterModule("FilePathCheckDLL", "SecurityModule")
$hwp.XHwpWindows.Item(0).Visible = $false
$outDir = "E:\예원예술대학교_규정관리시스템\scratch\hwp_texts"
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir }
Write-Host "Converting 3-1-6_감사규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-6_감사규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-6_감사규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_texts\3-1-6_감사규정.hwp.txt', "TEXT", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-6_감사규정.hwp" }
Write-Host "Converting 1-0-4_교원_징계규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\1-0-4_교원_징계규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\1-0-4_교원_징계규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_texts\1-0-4_교원_징계규정.hwp.txt', "TEXT", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\1-0-4_교원_징계규정.hwp" }
Write-Host "Converting 3-2-9_교원_특별채용에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-9_교원_특별채용에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-9_교원_특별채용에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_texts\3-2-9_교원_특별채용에_관한_규정.hwp.txt', "TEXT", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-9_교원_특별채용에_관한_규정.hwp" }
Write-Host "Converting 3-2-12_교원업적평가_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-12_교원업적평가_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-12_교원업적평가_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_texts\3-2-12_교원업적평가_규정.hwp.txt', "TEXT", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-12_교원업적평가_규정.hwp" }
Write-Host "Converting 3-1-14_교육_및_교육지원시설에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-14_교육_및_교육지원시설에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-14_교육_및_교육지원시설에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_texts\3-1-14_교육_및_교육지원시설에_관한_규정.hwp.txt', "TEXT", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-14_교육_및_교육지원시설에_관한_규정.hwp" }
Write-Host "Converting 3-2-21_교직원_복무_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-21_교직원_복무_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-21_교직원_복무_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_texts\3-2-21_교직원_복무_규정.hwp.txt', "TEXT", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-21_교직원_복무_규정.hwp" }
Write-Host "Converting 3-5-6_교직원_여비지급_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-6_교직원_여비지급_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-6_교직원_여비지급_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_texts\3-5-6_교직원_여비지급_규정.hwp.txt', "TEXT", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-6_교직원_여비지급_규정.hwp" }
Write-Host "Converting 2-0-4_대학원_학칙.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-4_대학원_학칙.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-4_대학원_학칙.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_texts\2-0-4_대학원_학칙.hwp.txt', "TEXT", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-4_대학원_학칙.hwp" }
Write-Host "Converting 4-0-11_대학평의원회운영규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-11_대학평의원회운영규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-11_대학평의원회운영규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_texts\4-0-11_대학평의원회운영규정.hwp.txt', "TEXT", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-11_대학평의원회운영규정.hwp" }
Write-Host "Converting 4-0-12_등록금심의위원회_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-12_등록금심의위원회_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-12_등록금심의위원회_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_texts\4-0-12_등록금심의위원회_규정.hwp.txt', "TEXT", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\4-0-12_등록금심의위원회_규정.hwp" }
Write-Host "Converting 2-0-7_문화영상창업대학원_학사운영_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-7_문화영상창업대학원_학사운영_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-7_문화영상창업대학원_학사운영_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_texts\2-0-7_문화영상창업대학원_학사운영_규정.hwp.txt', "TEXT", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-7_문화영상창업대학원_학사운영_규정.hwp" }
Write-Host "Converting 5-1-9_문화예술교육원_운영규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-9_문화예술교육원_운영규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-9_문화예술교육원_운영규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_texts\5-1-9_문화예술교육원_운영규정.hwp.txt', "TEXT", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-9_문화예술교육원_운영규정.hwp" }
Write-Host "Converting 3-2-11_비정년계열_전임교원_인사규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-11_비정년계열_전임교원_인사규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-11_비정년계열_전임교원_인사규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_texts\3-2-11_비정년계열_전임교원_인사규정.hwp.txt', "TEXT", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-11_비정년계열_전임교원_인사규정.hwp" }
Write-Host "Converting 3-4-18_소수_집단_학생_지원_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-18_소수_집단_학생_지원_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-18_소수_집단_학생_지원_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_texts\3-4-18_소수_집단_학생_지원_규정.hwp.txt', "TEXT", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-4-18_소수_집단_학생_지원_규정.hwp" }
Write-Host "Converting 3-3-1_수업관리규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-1_수업관리규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-1_수업관리규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_texts\3-3-1_수업관리규정.hwp.txt', "TEXT", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-1_수업관리규정.hwp" }
Write-Host "Converting 5-1-7_신문방송국규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-7_신문방송국규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-7_신문방송국규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_texts\5-1-7_신문방송국규정.hwp.txt', "TEXT", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-7_신문방송국규정.hwp" }
Write-Host "Converting 3-5-11_업무추진비_지급_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-11_업무추진비_지급_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-11_업무추진비_지급_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_texts\3-5-11_업무추진비_지급_규정.hwp.txt', "TEXT", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-5-11_업무추진비_지급_규정.hwp" }
Write-Host "Converting 3-2-15_연구년제_운영규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-15_연구년제_운영규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-15_연구년제_운영규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_texts\3-2-15_연구년제_운영규정.hwp.txt', "TEXT", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-2-15_연구년제_운영규정.hwp" }
Write-Host "Converting 2-0-2_예원예술대학교_학칙.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-2_예원예술대학교_학칙.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-2_예원예술대학교_학칙.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_texts\2-0-2_예원예술대학교_학칙.hwp.txt', "TEXT", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-2_예원예술대학교_학칙.hwp" }
Write-Host "Converting 3-3-20_원격수업_운영에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-20_원격수업_운영에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-20_원격수업_운영에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_texts\3-3-20_원격수업_운영에_관한_규정.hwp.txt', "TEXT", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-20_원격수업_운영에_관한_규정.hwp" }
Write-Host "Converting 3-1-4_위임전결_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-4_위임전결_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-4_위임전결_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_texts\3-1-4_위임전결_규정.hwp.txt', "TEXT", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-4_위임전결_규정.hwp" }
Write-Host "Converting 3-3-12_전문가과정_운영_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-12_전문가과정_운영_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-12_전문가과정_운영_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_texts\3-3-12_전문가과정_운영_규정.hwp.txt', "TEXT", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-12_전문가과정_운영_규정.hwp" }
Write-Host "Converting 3-3-4_전임교원_책임시수_및_강의료_지급규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-4_전임교원_책임시수_및_강의료_지급규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-4_전임교원_책임시수_및_강의료_지급규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_texts\3-3-4_전임교원_책임시수_및_강의료_지급규정.hwp.txt', "TEXT", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-3-4_전임교원_책임시수_및_강의료_지급규정.hwp" }
Write-Host "Converting 3-1-12_직인관리_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-12_직인관리_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-12_직인관리_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_texts\3-1-12_직인관리_규정.hwp.txt', "TEXT", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\3-1-12_직인관리_규정.hwp" }
Write-Host "Converting 5-1-3_평생교육원_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-3_평생교육원_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-3_평생교육원_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_texts\5-1-3_평생교육원_규정.hwp.txt', "TEXT", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\5-1-3_평생교육원_규정.hwp" }
Write-Host "Converting 2-0-3_학업이수에_관한_규정.hwp"
if (Test-Path 'E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-3_학업이수에_관한_규정.hwp') {
  $hwp.Open('E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-3_학업이수에_관한_규정.hwp', "HWP", "forceopen:true")
  $hwp.SaveAs('E:\예원예술대학교_규정관리시스템\scratch\hwp_texts\2-0-3_학업이수에_관한_규정.hwp.txt', "TEXT", "")
  $hwp.Clear(1)
} else { Write-Host "File not found: E:\예원예술대학교_규정관리시스템\public\files\rules\2-0-3_학업이수에_관한_규정.hwp" }
$hwp.Quit()