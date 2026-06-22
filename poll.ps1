for ($i=0; $i -lt 30; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "https://yewon-rules.pages.dev/api/fix-511" -Method Get
        Write-Output "Success!"
        Write-Output ($response | ConvertTo-Json)
        break
    } catch {
        Write-Output "Waiting for deployment... attempt $i"
        Start-Sleep -Seconds 10
    }
}
