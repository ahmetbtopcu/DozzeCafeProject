# Nöbetçi — Otomatik Belediye Hesap Sorma Motoru

> Cursor Hackathon (6 Haziran 2026) — Sokak ihlallerini fotoğrafla, CV ile sınıflandır,
> doğru kuruma yönlendir, mevzuat maddesiyle hukuki dilekçe üret.

## Canlı Ortam

| Servis | URL |
|--------|-----|
| Go API | `https://nobetci-backend.onrender.com` |
| AI servis | `https://nobetci-ai-service.onrender.com` |
| Web panel | Vercel (deploy sonrası) |

Backend **yalnızca Render'da** çalışır; lokal Go/Python sunucusu gerekmez.

## Mimari

| Klasör | Teknoloji | Hosting |
|--------|-----------|---------|
| `web/` | Next.js + Leaflet | Vercel |
| `backend/` | Go API | Render |
| `ai-service/` | FastAPI + YuNet blur + YOLO | Render |
| `docs/` | KVKK + mevzuat + model araştırması | — |

## Deploy

### Render (backend + AI)
```bash
# Render Dashboard → Blueprint → render.yaml
# veya: render blueprint sync
```
- `DEMO_MODE=true` (free tier)
- Cold start ~30–60 sn — sunumdan 2 dk önce `scripts/warmup-health.ps1` çalıştırın

### Vercel (web)
```bash
cd web
# Vercel env: NEXT_PUBLIC_API_URL=https://nobetci-backend.onrender.com
vercel deploy
```

## Ortam değişkenleri
`.env.example` dosyasını kopyalayın. Anahtarlar repoya girmez.

## Lokasyon Verisi
İl/ilçe/mahalle dropdown'ları lokal JSON'dan değil, resmi açık veri kaynağından
beslenir. Varsayılan kaynak İBB Açık Veri Portalı **Muhtarlık Adres Bilgileri**
GeoJSON dosyasıdır. Türkiye geneli TUCBS/WFS servis adresi hazırlandığında
`LOCATION_OPEN_DATA_URL` ile aynı formatta dönen dönüştürücü endpoint'e geçilebilir.

## AI Stack (özet)

| Katman | Model |
|--------|-------|
| Blur (KVKK) | OpenCV YuNet + LPD-YuNet (MIT) |
| Tespit (demo) | `demo/cache.json` — 5 örnek |
| Tespit (canlı) | YOLO-World-S @320, conf 0.35 |
| RAG | Keyword fallback (free tier) |
| Dilekçe | Şablon (+ opsiyonel LLM) |

Detay: [`docs/model-arastirma.md`](docs/model-arastirma.md)

## KVKK
- YuNet + LPD-YuNet blur model öncesi
- `scripts/purge-raw-data.ps1` — ham veri imhası
- `docs/KVKK-veri-imha-belgesi.md`

## Takım
- Ahmet Bayram Topcu + Memo
