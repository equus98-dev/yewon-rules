for ($i=0; $i -lt 30; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "https://yewon-rules.pages.dev/api/check-14" -Method Get
        if ($response.success) {
            Write-Output "Success!"
            Write-Output ($response | ConvertTo-Json -Depth 10)
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
