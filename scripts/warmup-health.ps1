# Render cold start — sunumdan 2 dk önce çalıştırın
# Kullanım: .\scripts\warmup-health.ps1

$backend = $env:NEXT_PUBLIC_API_URL
if (-not $backend) {
    $backend = "https://nobetci-backend.onrender.com"
}
$ai = $env:AI_SERVICE_URL
if (-not $ai) {
    $ai = "https://nobetci-ai-service.onrender.com"
}

Write-Host "Warmup: $backend"
Write-Host "Warmup: $ai"

$maxAttempts = 12
for ($i = 1; $i -le $maxAttempts; $i++) {
    try {
        $r1 = Invoke-RestMethod -Uri "$backend/health" -TimeoutSec 90
        $r2 = Invoke-RestMethod -Uri "$ai/health" -TimeoutSec 90
        Write-Host "OK backend=$($r1.status) ai=$($r2.status) demo=$($r2.demo_mode)"
        exit 0
    } catch {
        Write-Host "Deneme $i/$maxAttempts — bekleniyor (cold start)..."
        Start-Sleep -Seconds 10
    }
}

Write-Host "Warmup tamamlanamadi — demo cache ile devam edin."
exit 1
