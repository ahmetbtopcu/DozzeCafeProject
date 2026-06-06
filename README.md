# Nöbetçi — Otomatik Belediye Hesap Sorma Motoru

> Cursor Hackathon (6 Haziran 2026) — Sokak ihlallerini fotoğrafla, CV ile sınıflandır,
> doğru kuruma yönlendir, mevzuat maddesiyle hukuki dilekçe üret.

## Problem
Türkiye'de kaldırım işgali, çukur, kırık tabela ve çöp en çok şikayet edilen konular.
Vatandaşlar CİMER/153'e yazıyor ama **hangi kuruma, hangi maddeyle** şikayet edeceğini bilmiyor.

## Çözüm
1. Fotoğraf yükle → yüz/plaka **anonimleştirilir** (KVKK).
2. CV ihlal türünü tespit eder.
3. RAG mevzuat maddesini ve **sorumlu kurumu** bulur (yetki yönlendirici).
4. Resmi dilekçe otomatik üretilir.
5. Haritada ihlaller ve istatistikler görüntülenir.

## Mimari

| Klasör | Teknoloji | Hosting |
|--------|-----------|---------|
| `web/` | Next.js + Leaflet | Vercel |
| `mobile/` | Expo | — |
| `backend/` | Go (masterfabric-go) | Render |
| `ai-service/` | Python FastAPI + HF modelleri | Render |
| `docs/` | KVKK + mevzuat corpus | — |

## Kurulum

```bash
# AI servis
cd ai-service
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001

# Backend
cd backend
go run ./cmd/api

# Web
cd web && npm install && npm run dev

# Mobile
cd mobile && npm install && npx expo start
```

### Ortam değişkenleri
`.env.example` dosyasını `.env` olarak kopyalayın.

## AI Araçları (jüri dökümantasyonu)

### Cursor IDE + Agentic Ruleset
- `.cursor/rules/` — `00-proje.mdc`, `kvkk.mdc`, `git-commit.mdc`, `stack.mdc`, `proje-spec.mdc`
- **Plan-then-execute:** Önce mimari plan (Composer), sonra faz faz agent implementasyonu
- **Prompt teknikleri:** Bağlam dosyası ekleme (plan.md), stack kısıtlarını rules ile gömme, incremental commit talimatı

### Cursor CLI / SDK
- Geliştirme Cursor Agent modunda; commit disiplini `git-commit.mdc` ile otomatik hatırlatma
- `scripts/purge-raw-data.ps1` — KVKK ham veri imhası (PowerShell)

### Modeller (Hugging Face)
| Model | Kullanım |
|-------|----------|
| YOLO-World (`yolov8s-world.pt`) | Sıfır-atış ihlal tespiti |
| RDD2022 / yol hasarı weights | Çukur tespiti (yedek) |
| `ytu-ce-cosmos/turkish-e5-large` | Mevzuat RAG embedding |
| OpenCV Haar cascade | KVKK yüz blur (model öncesi) |

### KVKK
- `ai-service/app/anonymize.py` — blur pipeline model öncesi çalışır
- Ham görüntü `data/raw/` — `.gitignore` korumalı
- `docs/KVKK-veri-imha-belgesi.md` + `scripts/purge-raw-data.ps1`

## Takım
- Ahmet Bayram Topcu + Memo
