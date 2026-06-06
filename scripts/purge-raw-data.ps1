# KVKK — ham görüntü verilerini kalıcı sil
# Kullanım: .\scripts\purge-raw-data.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$rawDir = Join-Path $root "data\raw"

Write-Host "Ham veri imhasi basliyor: $rawDir"

if (Test-Path $rawDir) {
    $files = Get-ChildItem -Path $rawDir -File -Recurse
    $count = $files.Count
    Remove-Item -Path "$rawDir\*" -Recurse -Force -ErrorAction SilentlyContinue
    # .gitkeep koru
    New-Item -Path (Join-Path $rawDir ".gitkeep") -ItemType File -Force | Out-Null
    Write-Host "Silinen dosya sayisi: $count"
} else {
    Write-Host "data/raw bulunamadi — zaten temiz."
}

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "Imha tamamlandi: $timestamp"
Write-Host "Belge: docs/KVKK-veri-imha-belgesi.md dosyasini guncelleyin."
