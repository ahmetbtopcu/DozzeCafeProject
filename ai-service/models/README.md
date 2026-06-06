# AI Model Dosyaları

Bu klasördeki ağırlıklar **git'e commit edilmez** (`.gitignore`).

## İndirme

```powershell
# Tüm modeller (YuNet + YOLO-World)
.\scripts\download-models.ps1
```

## Beklenen dosyalar

| Dosya | Kaynak | Boyut (yaklaşık) |
|-------|--------|------------------|
| `face_detection_yunet_2023mar.onnx` | opencv_zoo | ~1 MB |
| `license_plate_detection_yunet_2023mar.onnx` | opencv_zoo | ~1 MB |
| `yolov8s-worldv2.pt` | Ultralytics | ~25 MB |
| `pothole_best.pt` | keremberke HF (opsiyonel) | ~22 MB |
| `trash_yolo11n.pt` | Alope HF (opsiyonel) | ~5 MB |
