# KVKK Veri İmha ve Anonimleştirme Belgesi

> Bu belge ödül hakedişi için **zorunlu**dur. Hackathon sonunda ham görsellerin
> silindiğini ve anonimleştirme yapıldığını yazılı olarak belgeler.
> Etkinlik sonunda ilgili alanlar doldurulup imzalanacaktır.

## 1. Takım Bilgileri
- **Takım adı:** _______________
- **Üyeler:** _______________ , _______________
- **Tarih:** 6 Haziran 2026

## 2. İşlenen Verinin Kapsamı
- **Veri kaynağı:** Vatandaşın çektiği/yüklediği fotoğraf, Google Street View API veya sağlanan veri seti
- **Amaç:** Yalnızca cansız kentsel ihlal tespiti ve hukuki başvuru taslağı üretimi (kaldırım işgali, yol çukuru, kırık tabela, çöp birikimi vb.)
- **İşlenmeyen veriler:** Yüz tanıma, plaka okuma, kişi/araç takibi, profilleme YAPILMAMIŞTIR.

## 3. Anonimleştirme
- [ ] İnsan yüzleri model çalışmadan önce geri döndürülemez şekilde bulanıklaştırıldı.
- [ ] Araç plakaları geri döndürülemez şekilde bulanıklaştırıldı.
- **Kullanılan yöntem:** Cihaz tarafında düşük çözünürlüğe indirme + blur/downsample. Demo arayüzünde ham görsel backend'e gönderilmeden önce anonimleştirilmiş önizleme oluşturulur.
- **Anonimleştirme kodu:** `web/src/app/page.tsx` (demo önizleme akışı)

## 4. Veri Güvenliği
- [ ] Ham veriler açık repoya / şifrelenmemiş buluta yüklenmedi.
- [ ] API anahtarları yalnızca `.env` içinde tutuldu, commit edilmedi.
- **Depolama konumu:** Lokal/geçici tarayıcı belleği; backend demo akışında ham görüntü saklanmaz.

## 4.1. Hukuki Metin Güvenliği
- Üretilen dilekçe metni “taslak başvuru” olarak sunulur; kesin hukuki danışmanlık iddiası taşımaz.
- Mevzuat eşleşmeleri küçük ve kontrollü RAG korpusundan yapılır: `docs/legal/cimer-plus-corpus.json`.
- Kimlik tespiti, kişi takibi veya plaka/yüz verisi saklama yapılmaz.

## 5. İmha (Hackathon Sonu)
- [ ] Tüm ham görüntüler kalıcı olarak silindi.
- **Silme tarihi/saati:** _______________
- **Silme yöntemi:** _______________ (ör. `Remove-Item -Recurse -Force data/raw`)
- **Doğrulama:** _______________ (klasörün boş olduğunun ekran görüntüsü/çıktısı)

## 6. Beyan
Yukarıdaki bilgilerin doğru olduğunu ve KVKK kurallarına uyulduğunu beyan ederiz.

İmza / İsim: _______________      İmza / İsim: _______________
