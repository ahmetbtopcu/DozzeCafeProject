# Çöp Modeli Fine-Tune Rehberi

Bu klasör, **çöp/moloz yığını** tespiti için kendi modelinizi eğitmenizi sağlar.
Bu kategori için hazır güvenilir model **yoktur**:

- Hazır atık-ayrıştırma modelleri (cam/kağıt/plastik) sokak çöp yığınını değil
  tekil ambalajı bulur; testte **çukur fotoğrafına çöpten daha yüksek skor**
  verdiği için devre dışı bırakıldı.

Kaldırım işgali (YOLO-World araç tespiti) ve yol hasarı (RDD2022) zaten çalışıyor;
fine-tune sadece bu eksik kategori içindir. Ayrıca CLIP sahne doğrulama katmanı
yanlış pozitifleri azaltır (önce sahneyi tanır, sonra ilgili model çalışır).

## 1. Veri seti topla

Önerilen hazır kaynaklar (Roboflow Universe — YOLOv8 formatında indir):

- Roboflow Universe: "garbage detection", "illegal dumping", "street waste", "trash pile"
- TACO (Trash Annotations in Context): http://tacodataset.org
- En iyisi: kendi şehrinizden 200–500 sokak çöp yığını fotoğrafı toplayıp
  Roboflow / Label Studio ile `garbage_pile` tek sınıf olarak etiketleyin.

Tek sınıflı dataset en sağlıklısıdır (model sadece ihlali öğrenir).

## 2. Klasör yapısı + data.yaml

```
data/finetune/garbage/
├── images/train/*.jpg
├── images/val/*.jpg
├── labels/train/*.txt      # YOLO formatı: <cls> <cx> <cy> <w> <h> (normalize)
├── labels/val/*.txt
└── data.yaml
```

`data.yaml` örneği:

```yaml
path: data/finetune/garbage
train: images/train
val: images/val
names:
  0: garbage_pile
```

## 3. Eğit

GPU önerilir (Colab ücretsiz T4 yeterli). CPU'da çok yavaştır.

```bash
python scripts/finetune/train.py --data data/finetune/garbage/data.yaml --task garbage --epochs 80
```

Script en iyi ağırlığı otomatik `ai-service/models/garbage_finetuned.pt` olarak kopyalar.

## 4. Aktifleştir

`.env` veya Render ortam değişkenleri:

```
ENABLE_GARBAGE_SPECIALIST=true
```

Servisi yeniden başlatın. Model otomatik yüklenir (lazy). CLIP bir resmi "çöp
sahnesi" olarak sınıflandırırsa bu model çağrılıp doğrular.

## 5. Doğrula

```bash
python scripts/run-test-batch.py
```

Eşiği ortam değişkeniyle ayarlayabilirsiniz: `SPECIALIST_GARBAGE_CONF` (varsayılan 0.45).

## Notlar

- Eğitim formatı standart Ultralytics; mimari değişikliği gerekmez.
- Render imajına gömmek için ağırlığı repoya (Git LFS) ekleyip Dockerfile'a
  kopyalama satırı koyabilir ya da başlangıçta indirebilirsiniz.
- Mimari: `ai-service/app/detect.py` — CLIP sahneyi belirler, yalnızca ilgili
  dedektör (araç / yol / çöp) çalışıp doğrular.
