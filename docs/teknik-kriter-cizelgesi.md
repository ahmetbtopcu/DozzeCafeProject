# Teknik Zorunluluk / Kriter Çizelgesi

Brifingde (10:00-11:00) teslim edilecek resmî çizelge ile karşılaştırmalı takip
için kontrol listesi. Puanlama 100 üzerinden.

## Puanlama dağılımı
| Puan | Kriter | Durum |
|------|--------|-------|
| 30 | Teknik çalışırlık (hatasız derlenme, mimariye uyum, canlı demo) | ⬜ |
| 25 | Doğruluk ve güvenilirlik (CV başarı oranı) | ⬜ |
| 20 | Kamu faydasına uygunluk | ⬜ |
| 10 | AI adaptasyonu (Cursor IDE, agentic, AI dökümantasyonu) | ⬜ |
| 10 | KVKK ve etik uyum | ⬜ |
| 5  | Sunum ve dökümantasyon (README kalitesi) | ⬜ |

## Ödül hakedişi zorunlu koşulları (4/4 şart)
- [ ] Canlı demo yapıldı
- [ ] Tekrarlanabilir sonuçlar üretildi
- [ ] Çalıştırılabilir kaynak kod teslim edildi (commit geçmişi ile)
- [ ] KVKK veri silme/anonimleştirme belgesi hazır

## Teknik zorunluluklar
- [ ] Web: Next.js — Vercel deploy
- [ ] Backend: Go + masterfabric-go mimarisi (birebir)
- [ ] AI: Hugging Face model/dataset
- [ ] Google Street View API (≤ 10.000 istek)
- [ ] Cursor IDE + agentic ruleset (`.cursor/rules`)
- [ ] Aşamalı commit geçmişi (anlamlı mesajlar)
- [ ] README'de AI araç dökümantasyonu
- [ ] (Ekstra puan) Cursor CLI / SDK kullanımı belgelendi

## Ekstra puan fırsatı
> Cursor CLI ve/veya SDK'yı geliştirme/otomasyonda kullanıp README'de belgeleyen
> ekipler AI Adaptasyonu kriterinde ekstra avantaj kazanır. Demo gününde otomasyon
> (ör. test/lint/commit) için Cursor CLI kullanmayı değerlendir.
