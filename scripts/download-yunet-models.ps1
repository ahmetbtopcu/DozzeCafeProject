# YuNet + LPD-YuNet ONNX indir (lokal ai-service geliştirme)
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$dir = Join-Path $root "ai-service\models"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

$face = Join-Path $dir "face_detection_yunet_2023mar.onnx"
$plate = Join-Path $dir "license_plate_detection_yunet_2023mar.onnx"

Invoke-WebRequest -Uri "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx" -OutFile $face
Invoke-WebRequest -Uri "https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/license_plate_detection_yunet/license_plate_detection_lpd_yunet_2023mar.onnx" -OutFile $plate

Write-Host "Modeller indirildi: $dir"
