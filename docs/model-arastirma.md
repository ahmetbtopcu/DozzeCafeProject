# Model Araştırması — Nöbetçi CV Stack

## Karar özeti (Render free tier + demo)

| Katman | Seçim | Gerekçe |
|--------|-------|---------|
| Blur | **YuNet + LPD-YuNet** | MIT, ~50–150 ms CPU, yüz+plaka |
| Tespit (birincil) | **DEMO cache** | Tekrarlanabilir jüri sonucu |
| Tespit (ikincil) | **YOLO-World-S @320** | Açık sözlük, conf 0.35 |
| CLIP | **Kullanılmıyor** | Bbox yok, RAM yükü |
| Uzman (sonra) | Alope trash + keremberke pothole | Standard tier |

## Blur karşılaştırması

| Sıra | Yöntem | Yüz | Plaka | Lisans |
|------|--------|-----|-------|--------|
| 1 | YuNet + LPD-YuNet | İyi | İyi | MIT |
| 2 | deface + LPD-YuNet | Çok iyi | İyi | MIT |
| 3 | Haar + heuristic (eski) | Zayıf | Zayıf | Apache |

Kaynak: [opencv_zoo](https://github.com/opencv/opencv_zoo)

## YOLO karşılaştırması

| Model | Hız (free tier) | Güven | Not |
|-------|-----------------|-------|-----|
| DEMO cache | ~50 ms | Sabit | Jüri |
| YOLO11n ONNX @320 | ~0.3–0.8 s | 0.55–0.85 | Uzman görevler |
| YOLO-World-S | ~1.5–4 s | 0.25–0.55 | Mevcut tek model |
| rezzzq/yolo12s-road-damage | ~1.5–3 s | 0.50–0.75 | Ağır |

### Hugging Face modelleri

- Çukur: [keremberke/yolov8s-pothole-segmentation](https://huggingface.co/keremberke/yolov8s-pothole-segmentation)
- Çöp: [Alope/trash-detection-yolo11n](https://huggingface.co/Alope/trash-detection-yolo11n)
- Yol hasarı: [rezzzq/yolo12s-road-damage-rdd2022](https://huggingface.co/rezzzq/yolo12s-road-damage-rdd2022)

## CLIP

Plain CLIP yalnızca görüntü düzeyinde sınıflandırma yapar; bbox üretmez. Nöbetçi şiddet skoru için bbox zorunlu → **YOLO-World** doğru seçim.

## Uygulama dosyaları

- Blur: `ai-service/app/anonymize.py`
- Tespit: `ai-service/app/detect.py`
- Demo: `ai-service/demo/cache.json`
- Uzman: `ai-service/app/detect_specialists.py` (`ENABLE_SPECIALIST_MODELS=true`)
