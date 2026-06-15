$hwp = New-Object -ComObject HWPFrame.HwpObject
$hwp.RegisterModule('FilePathCheckDLL', 'raonkhwp')
$hwp.XHwpWindows.Item(0).Visible = $true
$hwp.Open('F:\예원예술대학교_규정관리시스템\docs\rules\별지 및 별표 모음\3-5-1 [제5호 서식] 이용신청서.hwp', 'HWP', 'forceopen:true')
Start-Sleep -Seconds 1
$hwp.SaveAs('F:\예원예술대학교_규정관리시스템\test_visible.pdf', 'PDF', '')
$hwp.Quit()
