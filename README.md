# Güngören Projesi — AI-Driven Kentsel Çözüm

> Cursor Hackathon (6 Haziran 2026, Dozze Coffee Başakşehir) için geliştirilen,
> kentsel objelerin bilgisayarlı görü ile tespitine dayalı, kamu faydası odaklı
> proje.

**Fikir (veri geldikten sonra netleşecek):** _Google Street View görüntüleri üzerinden
kentsel obje (tabela, çöp kutusu, hasarlı yol vb.) tespiti ve haritalama._

---

## 🏗️ Mimari (Monorepo)

| Klasör | Teknoloji | Hosting |
|--------|-----------|---------|
| `web/` | Next.js (TypeScript, App Router, Tailwind) | Vercel |
| `mobile/` | Expo (TypeScript) | — |
| `backend/` | Go (Golang) — **masterfabric-go mimarisi** | Render.com |
| `docs/` | KVKK belgeleri + kriter çizelgesi | — |
| `.cursor/rules/` | Agentic ruleset | — |

> Backend mimarisi etkinlik başında (11:00) teslim edilen resmî **masterfabric-go**
> yapısına birebir uyar. Şu anki `backend/` içeriği geçici placeholder'dır.

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

### Mobile (Expo)
```bash
cd mobile
npm install
npx expo start
```

### Backend (Go)
```bash
cd backend
go run ./cmd/api   # http://localhost:8080/health
```

### Ortam değişkenleri
`.env.example`'ı kopyalayıp doldurun. Anahtarlar **asla** commit edilmez.
```
GOOGLE_STREET_VIEW_API_KEY=...
HUGGINGFACE_TOKEN=...
NEXT_PUBLIC_API_URL=http://localhost:8080
EXPO_PUBLIC_API_URL=http://localhost:8080
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
- _(doldurulacak: kullanılan spesifik prompt yaklaşımları, plan-then-execute vb.)_

### Cursor CLI / SDK (ekstra puan)
- _(doldurulacak: otomasyon/test/commit akışında CLI veya SDK kullanımı)_

### Hugging Face
- _(doldurulacak: kullanılan model/dataset, neden seçildiği)_

---

## 🔒 KVKK ve Etik Uyum

- Modeller **yalnızca cansız kentsel objeler** için kullanılır.
- İnsan yüzü / araç plakası model çalışmadan önce **geri döndürülemez** biçimde
  bulanıklaştırılır.
- Ham veriler repoya/şifrelenmemiş buluta yüklenmez (`.gitignore` korumalı).
- Hackathon sonunda ham görüntüler silinir; bkz. `docs/KVKK-veri-imha-belgesi.md`.

---

## 📝 Geliştirme Disiplini

- Aşamalı, anlamlı commit'ler (Conventional Commits). Tek parça yükleme yapılmaz.
- Stack dışına çıkılmaz; masterfabric-go mimarisi bozulmaz.

## 👥 Takım
- _______________ , _______________
