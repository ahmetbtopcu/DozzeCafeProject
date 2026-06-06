# KVKK Veri İmha ve Anonimleştirme Belgesi

> Nöbetçi — Otomatik Belediye Hesap Sorma Motoru

## 1. Takım Bilgileri
- **Takım adı:** Nöbetçi (Dozze Coffee Başakşehir)
- **Üyeler:** Ahmet Bayram Topcu, Memo
- **Tarih:** 6 Haziran 2026

## 2. İşlenen Verinin Kapsamı
- **Veri kaynağı:** Vatandaş ihbar fotoğrafları, demo görüntüleri
- **Amaç:** Cansız kentsel ihlal tespiti
- **İşlenmeyen:** Yüz tanıma, plaka okuma (OCR), kişi takibi YAPILMAMIŞTIR

## 3. Anonimleştirme
- [x] Yüzler model öncesi geri döndürülemez blur
- [x] Plakalar model öncesi pixelation + blur
- **Yöntem:** OpenCV **YuNet** (yüz) + **LPD-YuNet** (plaka), MIT lisans
- **Kod:** `ai-service/app/anonymize.py`
- **Modeller:** `ai-service/models/*.onnx` (Docker build'de indirilir)

## 4. Veri Güvenliği
- [x] Ham veriler repoya yüklenmedi
- [x] API anahtarları `.env` içinde
- **Depolama:** `data/raw/` (gitignore)

## 5. İmha
- **Komut:** `.\scripts\purge-raw-data.ps1`
- **Tarih:** _(etkinlik sonu)_

## 6. Beyan
KVKK kurallarına uyulduğunu beyan ederiz.

İmza: _______________      İmza: _______________
