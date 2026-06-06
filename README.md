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
- `.cursor/rules/` — proje, KVKK, commit, stack, `proje-spec.mdc`
- Plan-then-execute: önce mimari plan, sonra faz faz implementasyon

### Modeller (Hugging Face)
- YOLO-World — açık sözlük ihlal tespiti
- RDD2022 weights — yol hasarı
- turkish-e5-large — mevzuat RAG embedding
- Depth Anything V2 (opsiyonel) — şiddet ölçümü

### KVKK
- Anonimleştirme pipeline model öncesi
- Ham görüntü `data/raw/` — `.gitignore` korumalı
- `docs/KVKK-veri-imha-belgesi.md` + `scripts/purge-raw-data.ps1`

## Takım
- Ahmet Bayram Topcu + Memo
