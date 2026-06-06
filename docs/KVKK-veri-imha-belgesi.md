# KVKK Veri İmha ve Anonimleştirme Belgesi

> Nöbetçi — Otomatik Belediye Hesap Sorma Motoru
> Hackathon sonunda ham görsellerin silindiğini ve anonimleştirme yapıldığını belgeler.

## 1. Takım Bilgileri
- **Takım adı:** Nöbetçi (Dozze Coffee Başakşehir)
- **Üyeler:** Ahmet Bayram Topcu, Memo
- **Tarih:** 6 Haziran 2026

## 2. İşlenen Verinin Kapsamı
- **Veri kaynağı:** Vatandaş ihbar fotoğrafları, Google Street View / Mapillary (demo)
- **Amaç:** Cansız kentsel ihlal tespiti (kaldırım işgali, çukur, tabela, çöp)
- **İşlenmeyen veriler:** Yüz tanıma, plaka okuma, kişi/araç takibi, profilleme YAPILMAMIŞTIR.

## 3. Anonimleştirme
- [x] İnsan yüzleri model çalışmadan önce geri döndürülemez şekilde bulanıklaştırıldı.
- [x] Araç plakaları geri döndürülemez şekilde bulanıklaştırıldı.
- **Kullanılan yöntem:** OpenCV Haar cascade (yüz) + alt bant plaka heuristic + Gaussian blur
- **Anonimleştirme kodu:** `ai-service/app/anonymize.py`

## 4. Veri Güvenliği
- [x] Ham veriler açık repoya / şifrelenmemiş buluta yüklenmedi.
- [x] API anahtarları yalnızca `.env` içinde tutuldu, commit edilmedi.
- **Depolama konumu:** Lokal `data/raw/` (`.gitignore` korumalı)

## 5. İmha (Hackathon Sonu)
- [ ] Tüm ham görüntüler kalıcı olarak silindi.
- **Silme komutu:** `.\scripts\purge-raw-data.ps1`
- **Silme tarihi/saati:** _(etkinlik sonunda doldurulacak)_
- **Doğrulama:** `data/raw/` yalnızca `.gitkeep` içerir

## 6. Beyan
Yukarıdaki bilgilerin doğru olduğunu ve KVKK kurallarına uyulduğunu beyan ederiz.

İmza / İsim: _______________      İmza / İsim: _______________
