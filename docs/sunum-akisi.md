# Nöbetçi — 3 Dakikalık Sunum Akışı

## 0:00–0:30 Problem
- Vatandaş ihlal görüyor ama kime, hangi maddeyle şikayet edeceğini bilmiyor
- CİMER/153'e yazıyor → yanlış kuruma gidiyor → sonuç yok

## 0:30–1:30 Canlı Demo (Expo veya Web)
1. Fotoğraf çek / yükle (Başakşehir demo görüntüsü)
2. **Anonimleştirme** göster (blur sayısı)
3. İhlal türü + şiddet skoru
4. **Yetki yönlendirici:** "İlçe Zabıta" / "Fen İşleri"
5. Otomatik **dilekçe** ekranda

## 1:30–2:15 Harita + İstatistik (Web panel)
- Şiddet renkli pinler
- Açık istatistik: ihlal türü dağılımı

## 2:15–2:45 Teknik WOW
- Pipeline: Anonimleştir → CV → RAG → Yetki → Dilekçe
- Tek LLM çağrısıyla yapılamaz (jüri kriteri)

## 2:45–3:00 KVKK + Kapanış
- Yüz/plaka blur model öncesi
- `purge-raw-data.ps1` — veri imhası
- "Nöbetçi — belediyeye hesap soran vatandaş asistanı"

## Yedek Plan
- `DEMO_MODE=true` → cache'li 5 örnek (`ai-service/demo/cache.json`)
- AI servis offline → Go backend demo fallback
- Yedek video: _(etkinlikte kaydedilecek)_
