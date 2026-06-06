# CİMER+ — Otomatik Belediye Hesap Sorma Motoru

> Cursor Hackathon (6 Haziran 2026, Dozze Coffee Başakşehir) için geliştirilen,
> kentsel ihlalleri bilgisayarlı görü ile kanıtlayan ve 10 saniyede hukuki
> dayanaklı başvuru taslağına dönüştüren kamu faydası odaklı proje.

**Fikir:** _Vatandaş kaldırım işgali, yol çukuru, kırık tabela veya çöp birikimi
gibi bir ihlali fotoğraflar. CİMER+ cihazda yüz/plaka bulanıklaştırır, ihlali
sınıflandırır, şiddetini ölçer, ilgili mevzuat maddesini seçer ve doğru kuruma
gönderilmeye hazır resmi dilekçe taslağı üretir._

Bu bir “çukur haritası” değil; CV kanıt motoru + RAG hukuk motoru + aksiyon
üreticisidir.

---

## 🏗️ Mimari (Monorepo)

| Klasör | Teknoloji | Hosting |
|--------|-----------|---------|
| `web/` | Next.js (TypeScript, App Router, Tailwind) | Vercel |
| `backend/` | Go (Golang) — **masterfabric-go mimarisi** | Render.com |
| `docs/` | KVKK belgeleri + mevzuat/RAG korpusu + kriter çizelgesi | — |
| `.cursor/rules/` | Agentic ruleset | — |

> Backend mimarisi etkinlik başında (11:00) teslim edilen resmî **masterfabric-go**
> yapısına birebir uyar. Şu anki backend, demo API'lerini gösteren sade bir
> placeholder olarak tutulur; resmi mimari gelince handler/usecase/repository
> desenine taşınacaktır.

## ⚙️ CİMER+ Akışı

1. Vatandaş web uygulamasında fotoğraf yükler.
2. Görsel modelden önce cihazda düşük çözünürlük + blur ile anonimleştirilir.
3. Backend ihlal türü ve şiddet skorunu üretir.
4. RAG korpusu ilgili mevzuat dayanağını seçer.
5. Sistem resmi başvuru/dilekçe taslağı ve kurum yönlendirmesi üretir.
6. Demo takip kartı başvuru durumunu ve sonraki adımı gösterir.

> Not: Demo gerçek CİMER/153 gönderimi yapmaz. Kullanıcıya kopyalanabilir
> “taslak başvuru” ve doğru başvuru kanalı önerilir.

---

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+ (mevcut: v22)
- Go 1.22+ (backend için kurulmalı)
- Git

### Web (Next.js)
```bash
cd web
npm install
npm run dev        # http://localhost:3000
```

### Backend (Go)
```bash
cd backend
go run ./cmd/api
# http://localhost:8080/health
# POST http://localhost:8080/api/reports/analyze
# POST http://localhost:8080/api/petitions/generate
# GET  http://localhost:8080/api/reports/demo-001
```

### Ortam değişkenleri
`.env.example`'ı kopyalayıp doldurun. Anahtarlar **asla** commit edilmez.
```
GOOGLE_STREET_VIEW_API_KEY=...
HUGGINGFACE_TOKEN=...
HUGGINGFACE_MODEL_ID=...
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## 🤖 AI Araçları ve Cursor Kullanımı

> Bu bölüm jüri değerlendirmesinin parçasıdır (AI Adaptasyonu — 10 puan).
> Geliştirme ilerledikçe doldurulacaktır.

### Cursor IDE
- Tüm geliştirme Cursor IDE üzerinde yapıldı.
- **Agentic Ruleset** (`.cursor/rules/`): Projenin değişmez kısıtları, KVKK
  kuralları, commit disiplini ve stack kuralları agent davranışına gömüldü:
  - `00-proje.mdc` — proje bağlamı + değişmez kısıtlar (alwaysApply)
  - `kvkk.mdc` — KVKK kırmızı çizgileri (alwaysApply)
  - `git-commit.mdc` — commit disiplini (alwaysApply)
  - `stack.mdc` — dosya bazlı stack kuralları (globs)

### Prompt Teknikleri
- Plan-then-execute yaklaşımıyla fikir önce uygulanabilir MVP akışına indirildi.
- CV, RAG, dilekçe üretimi ve KVKK adımları ayrı sorumluluklar olarak tasarlandı.
- Dilekçe üretiminde mevzuat dayanağı olmadan iddia kurmama kuralı benimsendi.

### Cursor CLI / SDK (ekstra puan)
- _(doldurulacak: otomasyon/test/commit akışında CLI veya SDK kullanımı)_

### Hugging Face
- CV sınıflama katmanı Hugging Face model entegrasyonuna hazırdır.
- İlk demo sınıfları: `kaldirim_isgali`, `yol_cukuru`, `kirik_tabela`,
  `cop_birikimi`, `engelli_rampasi_engeli`.
- Model güveni düşük olduğunda kullanıcı manuel ihlal türü seçebilir; bu, yanlış
  hukuki yönlendirme riskini azaltır.

---

## 🔒 KVKK ve Etik Uyum

- Modeller **yalnızca cansız kentsel objeler** için kullanılır.
- İnsan yüzü / araç plakası model çalışmadan önce cihaz tarafında **geri
  döndürülemez** biçimde bulanıklaştırılır. Demo akışında ham görüntü backend'e
  gönderilmez; düşük çözünürlüklü/blur önizleme yalnızca kullanıcıya gösterilir.
- Ham veriler repoya/şifrelenmemiş buluta yüklenmez (`.gitignore` korumalı).
- Hackathon sonunda ham görüntüler silinir; bkz. `docs/KVKK-veri-imha-belgesi.md`.

---

## 📝 Geliştirme Disiplini

- Aşamalı, anlamlı commit'ler (Conventional Commits). Tek parça yükleme yapılmaz.
- Stack dışına çıkılmaz; masterfabric-go mimarisi bozulmaz.

## 👥 Takım
- _______________ , _______________
