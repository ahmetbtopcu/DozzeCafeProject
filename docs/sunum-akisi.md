# Nöbetçi — 3 Dakikalık Sunum Akışı

## Sunum öncesi (zorunlu)
```powershell
.\scripts\warmup-health.ps1
```
Render free tier cold start ~30–60 sn. Canlı URL:
- Backend: `https://nobetci-backend.onrender.com`
- AI: `https://nobetci-ai-service.onrender.com`

## 0:00–0:30 Problem
Vatandaş ihlal görüyor ama hangi kuruma şikayet edeceğini bilmiyor.

## 0:30–1:30 Canlı Demo
1. Web veya Expo'dan foto yükle
2. **YuNet blur** (blur sayısı)
3. İhlal + şiddet (demo cache veya YOLO)
4. Yetki yönlendirici + dilekçe

## 1:30–2:15 Harita + istatistik
Web panel — `nobetci-backend.onrender.com` üzerinden

## 2:15–2:45 Teknik WOW
Anonimleştir → CV → RAG → Yetki → Dilekçe pipeline

## 2:45–3:00 KVKK
YuNet + LPD-YuNet, `purge-raw-data.ps1`

## Yedek
- `DEMO_MODE=true` — 5 cache örneği
- Backend uyuyorsa warmup script tekrar çalıştır
