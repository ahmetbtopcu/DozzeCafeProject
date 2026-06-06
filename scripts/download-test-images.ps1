# İnternet kaynaklı test görüntülerini indirir (kullanıcı görüntüleri hariç).
# Kullanım: .\scripts\download-test-images.ps1
$ErrorActionPreference = "Stop"
$root = Join-Path $PSScriptRoot ".." "data" "test"
$ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NobetciTestDataset/1.0"

$dirs = @("road_damage", "garbage_pile", "broken_sign")
foreach ($d in $dirs) { New-Item -ItemType Directory -Force -Path (Join-Path $root $d) | Out-Null }

$downloads = @(
  @{ rel = "road_damage\pothole_01.jpg"; url = "https://upload.wikimedia.org/wikipedia/commons/c/c7/Pothole_Big.jpg" },
  @{ rel = "road_damage\pothole_02.jpg"; url = "https://images.pexels.com/photos/5882673/pexels-photo-5882673.jpeg?auto=compress&cs=tinysrgb&w=1280" },
  @{ rel = "garbage_pile\garbage_01.jpg"; url = "https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg?auto=compress&cs=tinysrgb&w=1280" },
  @{ rel = "garbage_pile\garbage_02.jpg"; url = "https://images.pexels.com/photos/4099237/pexels-photo-4099237.jpeg?auto=compress&cs=tinysrgb&w=1280" },
  @{ rel = "broken_sign\broken_sign_01.jpg"; url = "https://images.pexels.com/photos/236988/pexels-photo-236988.jpeg?auto=compress&cs=tinysrgb&w=1280" }
)

foreach ($item in $downloads) {
  $dest = Join-Path $root $item.rel
  $ref = if ($item.url -match "pexels") { "https://www.pexels.com/" } else { "https://commons.wikimedia.org/" }
  curl.exe -L -A $ua -H "Referer: $ref" -o $dest $item.url
  $len = (Get-Item $dest).Length
  if ($len -lt 5000) { throw "Indirme basarisiz: $($item.rel) ($len byte)" }
  Write-Host "OK $($item.rel) ($len bytes)"
  Start-Sleep -Seconds 2
}

Write-Host "Tamam. Manifest: data/test/manifest.json"
