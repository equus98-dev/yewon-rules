for ($i=0; $i -lt 30; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "https://yewon-rules.pages.dev/api/check-14" -Method Get
        if ($response.success) {
            Write-Output "Success!"
            $response | ConvertTo-Json -Depth 10 | Out-File -FilePath "E:\예원예술대학교_규정관리시스템\512.json" -Encoding utf8
            break
        } else {
            Write-Output "Response was not success, retrying... $i"
            Start-Sleep -Seconds 10
        }
    } catch {
        Write-Output "Waiting for deployment... attempt $i"
        Start-Sleep -Seconds 10
    }
}
