FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 curl \
    && rm -rf /var/lib/apt/lists/*

COPY ai-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Model ağırlıkları (KVKK yüz blur + tespit) build sırasında imaja gömülür.
# Yüz: YuNet ONNX (opencv_zoo, MIT). Plaka blur YAPILMAZ — indirilmez.
RUN mkdir -p /app/models \
    && curl -fsSL -o /app/models/face_detection_yunet_2023mar.onnx \
      "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"

# YOLO-World-S v2 (kaldırım = araç tespiti) + RDD2022 yol hasarı uzman modeli
RUN python - <<'PY'
import shutil
from pathlib import Path

models = Path("/app/models")
models.mkdir(parents=True, exist_ok=True)

from ultralytics import YOLOWorld
YOLOWorld("yolov8s-worldv2.pt")
src = Path("yolov8s-worldv2.pt")
if src.is_file():
    shutil.move(str(src), models / "yolov8s-worldv2.pt")

from huggingface_hub import hf_hub_download
for local_name, repo_id in [
    ("rdd_road_damage.pt", "ozair23/yolov8-road-damage-detector"),
]:
    try:
        path = hf_hub_download(repo_id=repo_id, filename="best.pt")
        shutil.copy(path, models / local_name)
        print("OK", local_name)
    except Exception as exc:
        print("WARN specialist skip", local_name, exc)

# CLIP sahne doğrulama ağırlığını (ViT-B/32) imaja indir
import clip
clip.load("ViT-B/32", device="cpu")
print("OK clip ViT-B/32")
PY

COPY docs/mevzuat /app/docs/mevzuat
COPY ai-service/app /app/app
COPY ai-service/demo /app/demo

ENV PYTHONPATH=/app
ENV DEMO_MODE=false
ENV ENABLE_SPECIALIST_MODELS=true
ENV DETECT_TIMEOUT_SEC=30
EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
