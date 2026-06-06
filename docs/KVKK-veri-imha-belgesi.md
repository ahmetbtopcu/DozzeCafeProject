# KVKK Veri İmha ve Anonimleştirme Belgesi

> Bu belge ödül hakedişi için **zorunlu**dur. Hackathon sonunda ham görsellerin
> silindiğini ve anonimleştirme yapıldığını yazılı olarak belgeler.
> Etkinlik sonunda ilgili alanlar doldurulup imzalanacaktır.

## 1. Takım Bilgileri
- **Takım adı:** _______________
- **Üyeler:** _______________ , _______________
- **Tarih:** 6 Haziran 2026

## 2. İşlenen Verinin Kapsamı
- **Veri kaynağı:** Google Street View API / sağlanan veri seti
- **Amaç:** Yalnızca cansız kentsel obje tespiti (tabela, çöp kutusu, hasarlı yol vb.)
- **İşlenmeyen veriler:** Yüz tanıma, plaka okuma, kişi/araç takibi, profilleme YAPILMAMIŞTIR.

## 3. Anonimleştirme
- [ ] İnsan yüzleri model çalışmadan önce geri döndürülemez şekilde bulanıklaştırıldı.
- [ ] Araç plakaları geri döndürülemez şekilde bulanıklaştırıldı.
- **Kullanılan yöntem:** _______________ (ör. Gaussian blur + downsample)
- **Anonimleştirme kodu:** `___________` (repo içi dosya yolu)

## 4. Veri Güvenliği
- [ ] Ham veriler açık repoya / şifrelenmemiş buluta yüklenmedi.
- [ ] API anahtarları yalnızca `.env` içinde tutuldu, commit edilmedi.
- **Depolama konumu:** _______________ (lokal / geçici)

## 5. İmha (Hackathon Sonu)
- [ ] Tüm ham görüntüler kalıcı olarak silindi.
- **Silme tarihi/saati:** _______________
- **Silme yöntemi:** _______________ (ör. `Remove-Item -Recurse -Force data/raw`)
- **Doğrulama:** _______________ (klasörün boş olduğunun ekran görüntüsü/çıktısı)

## 6. Beyan
Yukarıdaki bilgilerin doğru olduğunu ve KVKK kurallarına uyulduğunu beyan ederiz.

İmza / İsim: _______________      İmza / İsim: _______________
