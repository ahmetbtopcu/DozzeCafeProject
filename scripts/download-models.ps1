# Tüm AI modellerini indir
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ai = Join-Path $root "ai-service"
$venv = Join-Path $ai ".venv"
$py = Join-Path $venv "Scripts\python.exe"

if (-not (Test-Path $py)) {
    Write-Host "venv olusturuluyor..."
    py -3 -m venv $venv
    & $py -m pip install --upgrade pip
    & $py -m pip install -r (Join-Path $ai "requirements.txt")
}

Write-Host "Modeller indiriliyor..."
& $py (Join-Path $root "scripts\download-models.py")
