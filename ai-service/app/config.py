import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

APP_ROOT = Path(__file__).resolve().parents[1]
MEVZUAT_DIR = APP_ROOT / "docs" / "mevzuat"
DEMO_CACHE = APP_ROOT / "demo" / "cache.json"
MODELS_DIR = APP_ROOT / "models"

FACE_MODEL = MODELS_DIR / "face_detection_yunet_2023mar.onnx"
YOLO_WORLD_MODEL = MODELS_DIR / "yolov8s-worldv2.pt"
# Yol hasarı: RDD2022 (ozair23/yolov8-road-damage-detector) — çukur + çatlaklar.
ROAD_DAMAGE_MODEL = MODELS_DIR / "rdd_road_damage.pt"
# Çöp/moloz: fine-tune edilmiş model buraya konur (scripts/finetune/).
# Hazır atık-ayrıştırma modelleri (Alope vb.) çukuru çöp sandığı için kullanılmaz.
GARBAGE_MODEL = MODELS_DIR / "garbage_finetuned.pt"

DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"
ENABLE_SPECIALIST_MODELS = os.getenv("ENABLE_SPECIALIST_MODELS", "true").lower() == "true"
# Çöp uzman modeli yalnızca fine-tune edilmiş ağırlık mevcutsa ve flag açıksa
# çalışır (varsayılan kapalı — henüz güvenilir hazır model yok).
ENABLE_GARBAGE_SPECIALIST = os.getenv("ENABLE_GARBAGE_SPECIALIST", "false").lower() == "true"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")

DETECT_TIMEOUT_SEC = float(os.getenv("DETECT_TIMEOUT_SEC", "30"))
YOLO_CONF = float(os.getenv("YOLO_CONF", "0.20"))
YOLO_IMGSZ = int(os.getenv("YOLO_IMGSZ", "640"))
MAX_IMAGE_WIDTH = int(os.getenv("MAX_IMAGE_WIDTH", "1280"))

# --- CLIP sahne doğrulama katmanı ---
# CLIP önce resmin içeriğini sınıflandırır (kaldırım/yol/çöp/yok), sonra yalnızca
# ilgili uzman model çalışıp doğrular. İki aşamalı (sahne + nesne) doğrulama.
ENABLE_CLIP_ROUTER = os.getenv("ENABLE_CLIP_ROUTER", "true").lower() == "true"
CLIP_MODEL_NAME = os.getenv("CLIP_MODEL_NAME", "ViT-B/32")
# CLIP bu eşiğin altında bir ihlal sahnesi göremezse "ihlal yok" kabul edilir.
CLIP_MIN_CONF = float(os.getenv("CLIP_MIN_CONF", "0.40"))
# Uzman/dedektör doğrulayamasa bile CLIP bu kadar eminse tek başına kabul edilir.
CLIP_STRONG_CONF = float(os.getenv("CLIP_STRONG_CONF", "0.75"))

# Uzman model / kapı minimum güven eşikleri.
DETECT_GATE_CONF = float(os.getenv("DETECT_GATE_CONF", "0.35"))
SPECIALIST_ROAD_CONF = float(os.getenv("SPECIALIST_ROAD_CONF", "0.50"))
SPECIALIST_GARBAGE_CONF = float(os.getenv("SPECIALIST_GARBAGE_CONF", "0.45"))

VIOLATION_CLASSES = {
    "sidewalk_occupation": "Kaldırım işgali",
    "road_damage": "Çukur / bozuk yol",
    "garbage_pile": "Çöp / moloz yığını",
}
